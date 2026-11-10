# Visuelle Regeln des Graphen (aus `components/graph/graph.component.ts`)

Alle Regeln, die **Werte berechnen** (Größe, Warnung, Icons, Cluster, Constraints, Geometrie),
werden als reine Funktionen nach `packages/core/src/rules/` übernommen und gegen Golden G2
getestet. Alles, was **zeichnet** (SVG, CSS, Zoom, Drag), entsteht neu in React
(`apps/web/src/features/graph/`). Zeilenangaben beziehen sich auf `graph.component.ts`.

Konstanten aus `constants/graph-settings.ts` (unverändert):

```ts
fadeOpacity: 0.1, zoomTransition: '0.1s ease-out', selectedCircleStrokeWidth: 2,
linkColor: '#999', linkOpacity: 0.6, linkStrokeWidth: 0.8, maxLinkStrokeWidth: 1.6,
dragAlphaTarget: 0.3, previewCircleRadius: 3, normalTextSize: 14, maxTextSize: 20,
circleRadius: 24, circleStrokeWidth: 1, minChargeForce: -400, linkDistance: 100,
defaultSizeMetric: 'sloc.physical', nodeGap: 100
```

## 1. Ansichtsabhängigkeit

`isComponentView = !!id || hasSingleComponent()`. Viele Regeln unterscheiden AV/KV. Die neue
Regel-API bekommt deshalb immer einen Parameter `view: 'app' | 'component'`.

## 2. Knotengröße, Warnung, Fehler (`generateNodeSizes`, Z. 245-315)

Für jeden Knoten:
1. Wenn `settings.nodeSizesBasedOnMetrics === false`: `width = height = 48` (2 × `circleRadius`),
   **keine Icons, keine warn/error-Neuberechnung** (Eigenheit V1). Fertig. **Neue App (ADR-011 A8):** Größe fest 48, Icons und warn/error werden aber wie unten berechnet.
2. `report = node.report?.aggregate || node.report`. Fehlt er: `width = height = 20`, keine Icons
   (Eigenheit V2, betrifft z. B. `connect()`-Komponenten). Fertig.
3. `node.icons = getNodeIcons(node, report, view)` (Abschnitt 3).
4. `metricValue = nestedStringAccess(report, sizeMetric)`.
5. `threshold = thresholds[`${type}.${label || id}`] ?? thresholds[type]` der gewählten Metrik
   (Achtung: Vergleich `!== undefined`, nicht Truthiness).
6. `warn = error = false`; wenn `metricValue >= threshold * 0.8 && metricValue < threshold` →
   `warn = true`; sonst wenn `metricValue >= threshold` → `error = true`.
7. `width = height = Math.sqrt((16000 / threshold) * metricValue / Math.PI)`. Ohne Schwelle (eine
   Metrik nur für Komponenten bei einem Funktionsknoten) ergibt das `NaN`. **Neue App (ADR-011
   A11):** feste Größe 48, keine Warnstufe, Icons wie sonst.
8. Nur AV: `width += 14` und `height += 14` (Vorschau-Breite, siehe Abschnitt 5).

`warn`/`error` färben den Rand **nur**, wenn `settings.currentSizeMetricErrorHighlighting` aktiv
ist (Klassen `warn`/`error` an `circle-overlay` und `inner-circle`).

## 3. Icons (`getNodeIcons`, Z. 371-470) – Reihenfolge und Texte exakt

1. Über **alle** Metriken in `qualityMetrics` (Reihenfolge der Definition):
   `threshold` wie oben; `if (!threshold) continue` (Truthiness!); `value = nested(report, id)`;
   `value >= threshold*0.8 && value < threshold` → `hasWarning`; `value >= threshold` →
   `hasError` und **Abbruch** der Schleife.
2. `hasWarning && !hasError` → `{ icon: 'warning', class: 'warn', description: D1 }`;
   sonst `hasError` → `{ icon: 'warning', class: 'error', description: D2 }`.
   - D1 Komponente: `This component almost exceeds at least one metric threshold. A solution might be to split it into smaller components.`
   - D1 Funktion: `This function almost exceeds at least one metric threshold. A solution might be to split it into smaller functions.`
   - D2 Komponente: `This component exceeds at least one metric threshold. A solution might be to split it into smaller components.`
   - D2 Funktion: `This function exceeds at least one metric threshold. A solution might be to split it into smaller functions.`
3. `report.sloc.logical === 0` → `{ 'delete', 'warn', 'Empty functions should be removed' }`;
   **sonst wenn** `type === 'innerFunction' && kind === 'ClassComponent' && !isUsingThis && !returnsJSX`
   → `{ 'content_cut', 'warn', 'This function has no this reference and should be extracted into a helper function.' }`.
4. `returnsJSX && id !== 'render'` → `{ 'content_cut', 'warn', 'Functions returning JSX should be components (except for the render function in class components)' }`.
5. `extends` (nur AV-Knoten) → `{ 'device_hub', 'warn', 'Component composition is recommended over inheritance. (see <Link https://reactjs.org/docs/composition-vs-inheritance.html>)' }`.
6. KV **und** `deprecatedMethods.includes(id)` → `{ 'report', 'warn', 'Deprecated React lifecycle method (see <Link https://reactjs.org/docs/react-component.html#legacy-lifecycle-methods>)' }`.

Im Altsystem enthalten 5 und 6 HTML (`<a href target=_blank>`), gerendert per `innerHTML`. Neu:
Icon-Beschreibung als Datenstruktur `{ text: string; link?: { href: string } }`; der Linktext ist
wie im Altsystem die URL (ADR-011, kein `innerHTML`). Golden G2 vergleicht den **normalisierten Text**
(Tags entfernt, Leerraum zusammengefasst).

## 4. Cluster (`generateCluster`, Z. 323-368) – nur KV

- Knoten für jLouvain: alle außer `type === 'component'` und `id === 'render'`; `constructor` wird
  zu `_constructor` (Schutz vor Objekt-Prototyp).
- Kanten: alle, deren Quelle oder Ziel `component` oder `render` ist, entfallen; `constructor` →
  `_constructor`.
- `cluster = jLouvain().nodes(n).edges(e)()`; falls falsy → unverändert.
- `hasCluster = Object.values(cluster).some(c => c > 0)`.
- `node.cluster = cluster[id === 'constructor' ? '_constructor' : id]`.
- Eigenheit V3: `hasCluster` wird im Altsystem nie zurückgesetzt (bleibt nach einer KV mit Clustern
  für die nächste KV `true`). Neu: pro Graph berechnet (UI-Korrektur, ADR-011).

Farben: `clusterColorScale(i)` = `clusterColors[i]` oder `'white'` ab Index 20.
Aufhellen (`calculateBrightenedColor`, Z. 317-321): Farbe nach HSL, `l = l + (1 - l) * b`.
Füllung `b = 0.75`, Ränder (`inner-circle`, `circle-overlay`) `b = 0.15`; nur wenn
`showCluster && view === 'component' && cluster !== undefined`. Der d3-color-Ersatz muss für
alle 20 Farben × 2 Helligkeiten dieselben Strings liefern wie `d3.hsl(...).toString()`
(Format `rgb(r, g, b)`). Referenzwerte: `testdata/golden/mini/legacy-cluster-colors.json`, erfasst mit
`tools/legacy/capture-cluster-colors.browser.js`. Es belegt nur die Cluster 0–6 der KV `App`
(`mini`); für die übrigen 13 Farben gibt es kein Testprojekt, sie hängen am 1:1 übernommenen
Algorithmus.

## 5. Geometrie der Vorschaukreise (AV)

Hilfsfunktionen (Z. 1130-1156), `ps = previewCircleRadius = 3`, `sw = circleStrokeWidth = 1`:
- `previewWidth = (ps + sw/2) * 4 = 14`
- `mainRadius(d) = (view === 'app' ? d.width - 14 : d.width) / 2`
- `outerRadius(d) = mainRadius(d) + sw/2 + previewWidth/4 = mainRadius(d) + 4`
- `indexAngle(i, r) = (i / r) * (ps + sw/2) * 2 = 7 * i / r`

Vorschaukreise (Z. 811-857): für jede Funktion `f` von `d.functions` (bereits sortiert, K2) mit
Index `i`: `f.width = d.width` (Breite des **Elternknotens**!), `r = outerRadius(f)`,
`cx = r * cos(indexAngle(i, r) - π/2)`, `cy = r * sin(indexAngle(i, r) - π/2)`, Radius 3,
Randbreite 1, Deckkraft 0.5, Klassen `function <type>` + ` jsx` + ` special`;
ausgeblendet (`display: none`), wenn `indexAngle(i + 2, r) > 2π`; Tooltip = `f.id`.

„...“ (Z. 984-1028): Die Funktion `i` mit `indexAngle(i+1, r) <= 2π && indexAngle(i+2, r) > 2π`
bekommt ein Text-Element „...“ an Winkel `indexAngle(i, r)` (Klassen `function dots <type>`,
Deckkraft 0.5, Schrift 8 px). Höchstens eins pro Knoten.

## 6. Hauptkreis, Overlay, innerer Kreis (`createMainCircle`, Z. 859-913)

- `circle.circle-node` mit `r = mainRadius(d)`; Klassen `circle-node <type>` + ` selected` + ` special`.
- `circle.circle-overlay` mit `r = mainRadius(d)`; Füllung `url(#diagonalHatch)` bei
  `type === 'component' && kind === 'ClassComponent'`, sonst `transparent`; Klassen
  `circle-overlay <type>` + ` special` + (bei Highlighting) ` warn`/` error`; Randbreite 1, ausgewählt 2.
  Klick auf Overlay = Knoten-Klick.
- Nur bei `returnsJSX`: `circle.inner-circle` mit `r = mainRadius(d) - 3`, `fill: none`, Klassen
  `inner-circle <type>` + ` special` + ` warn`/` error`, Randbreite 1.

## 7. Label und Icons (`createLabels`, Z. 915-950)

Nur wenn `settings.text`. `text.node-label` (14 px, `dominant-baseline: central`,
`text-anchor: middle`, `pointer-events: none`) mit `tspan.label-text` (Text `label || id`,
klickbar) und darunter `tspan` (`dy = 1.2em`, `x = 0`) mit je einem `tspan.icon <class>` pro Icon
(Text = Icon-Name, Schrift „Material Icons“ → Ligatur zeigt das Symbol).

## 8. Kanten (`createLinks`, Z. 658-671 und Tick, Z. 615-642)

- Gruppe mit `stroke #999`, `stroke-opacity 0.6`; Linie `stroke-width 0.8`, Übergang
  `stroke-width 0.1s ease-out`, `stroke-dasharray '4 2'` bei `inherits`, `marker-end url(#arrowhead)`.
- Start = Mittelpunkt Quelle. Ende = um `mainRadius(target) + 0.5` vor dem Zielmittelpunkt:
  `dist = hypot(dx, dy)`, `end = source + (d / dist) * (dist - targetRadius)`.
- Marker `#arrowhead`: `viewBox="-0 -5 10 10" refX=9 refY=0 orient=auto markerWidth=8 markerHeight=8`,
  Pfad `M 0,-5 L 10 ,0 L 0,5`, Füllung `#999`.
- Muster `#diagonalHatch`: `width=5 height=5 patternTransform="rotate(45 0 0)" patternUnits=userSpaceOnUse`,
  Linie `x1=0 y1=0 x2=0 y2=5`, Strichbreite 2, Deckkraft 0.6, Farbe = Komponentenfarbe.

## 9. Layout

### 9.1 WebCola („Vertical flow layout“, Standard)
```
size([containerWidth, containerHeight]).nodes(nodes).links(links)
  .constraints(view === 'component' ? reactConstraints(nodes, 100) : [])
  .avoidOverlaps(true).flowLayout('y', 100).symmetricDiffLinkLengths(40, 0.7)
  .start(40, 20, 20)
```
WebCola nutzt `node.width/height` für die Überlappungsvermeidung. Der Zufall ist geseedet → bei
gleicher Eingabe deterministisch (im Spike: Positionen identisch zum Altsystem bis auf eine
Verschiebung).

### 9.2 React-Constraints (`generateReactConstraints`, Z. 530-561)
Indizes aller vorhandenen Knoten in der Reihenfolge von `reactMethods` sammeln; für jedes Paar
aufeinanderfolgender Indizes `{ axis: 'x', left: a, right: b, gap: 100 }`.
Eigenheit V4: Paar wird übersprungen, wenn der **nächste** Index `0` (falsy) ist.

### 9.3 Kraft-Layout (Einstellung aus)
```
charge = force ?? Math.min(-4000 + nodes.length * 200, -400)
forceSimulation(nodes)
  .force('link', forceLink(links).distance(100))
  .force('charge', forceManyBody().strength(charge))
  .force('center', forceCenter(w / 2, h / 2))
  .force('collide', forceCollide().radius(d => (d.width / 2) * 1.2))
```
Hinweis: Im Altsystem bekommt `forceLink` Knotenobjekte (keine `.id()`-Funktion), weil die Kanten
vorher per `generateLinkReferences` aufgelöst wurden.

### 9.4 Layout-Ende
Beim **ersten** Ende eines Layouts und `autoZoom`: `zoomToFit()`. Bei jedem Ende und
`hideOverlappingLabels`: entprellt (250 ms) überlappende Labels ausblenden.

## 10. Zoom & Pan (`createSVG`, Z. 472-510; `zoomToFit`, Z. 1058-1089)

- Bei jeder Zoomänderung: `zoomLevel = round(k * 100)`; Transform auf Zoom-Gruppe.
- Wenn `14 * k > 20`: Label-Schrift `20 / k` px. Wenn `0.8 * k > 1.6`: Kantenbreite `1.6 / k`.
  (Eigenheit V5: wird nie zurückgesetzt, wenn wieder herausgezoomt wird – bleibt beim kleineren Wert
  stehen, bis der Graph neu gestartet wird.)
- Mausrad: Übergang `transform 0.1s ease-out` (und Label-Schrift) einschalten; Maustaste drücken:
  Übergänge aus. Doppelklick-Zoom aus.
- `zoomToFit(padding = 0.95, forceScale?)`: Bounding-Box der Zoom-Gruppe; leer → nichts;
  `scale = forceScale || Math.min(padding / Math.max(w / W, h / H), 3)`;
  `translate = [W/2 - scale*midX, H/2 - scale*midY]`; animiert (d3-Standard: 250 ms,
  `cubic-in-out`).

## 11. Ziehen von Knoten (`drag`, Z. 1091-1120)

- Kraft-Layout: beim ersten `drag`-Ereignis `alphaTarget(0.3).restart()`, `dragging = true`;
  `fx/fy = Mausposition`; bei `end`: `alphaTarget(0)`, ohne Shift `fx = fy = null`, `dragging = false`.
- WebCola: `Layout.dragStart(d)` → `Layout.drag(d, pos)` + `layout.resume()` → `Layout.dragEnd(d)`.

## 12. Ausblenden (`createFading`, Z. 711-804)

Nur wenn `settings.fade`. Zu Knoten `d`:
- `incoming` = Quellen aller Kanten mit Ziel `d`; `outgoing` = Ziele aller Kanten mit Quelle `d`.
- Bei `highlightIndirectNodes`: Breitensuche ab `outgoing` entlang ausgehender Kanten (ohne `d`,
  ohne Doppelte) → `indirect`.
- Knoten-Deckkraft 1 für `d`, incoming, outgoing, indirect; sonst 0.1 (d3-Transition 250 ms).
- Bei `highlightIndirectNodes`: `circle-node` der indirekten Knoten Füllung `#fafafa`.
- Kanten-Deckkraft 1, wenn sie `d` berühren oder beide Enden in `outgoing ∪ indirect` liegen; sonst 0.1.
- Während eines Drags wird nicht ausgeblendet. „Einblenden“ = alles auf 1.

## 13. Überlappende Labels (`hideOverlappingLabels`, Z. 952-982)

Für jedes Label `i` in Dokumentreihenfolge: einblenden, `<title>` am Knoten entfernen, Bounding-Box
mit allen **früheren** Labels `j < i` vergleichen; bei Überschneidung wird das **frühere** Label
ausgeblendet und dessen Knoten bekommt `<title>` mit dem Labeltext.

## 14. Auswahl-Darstellung (`updateGraph`, Z. 206-243)

Bei jeder Auswahländerung: Overlay-Randbreite 2 für ausgewählte, sonst 1; `circle-node` bekommt
` selected`; Clusterfarben wie in Abschnitt 4.

## 15. Legende (`graph.component.html:31-163`)

SVG `width=196`, Höhe/ViewBox AV `246` / `-16 -14 196 246`, KV `270` / `-16 -14 196 270`.
Überschrift „Legend“ (`y=16`, 16 px). Einträge (Kreis `r=12` bzw. AV-Funktionskreise `r=5`,
`cx=13 cy=12`, Text `x=33 y=12`, 12 px, Gewicht 300):

| Eintrag | Darstellung | y AV | y KV |
|---|---|---|---|
| Function Component | `circle-node circle-overlay component` | 32 | 32 |
| Class Component | `circle-node component` + Overlay mit Schraffur | 64 | 64 |
| Inner React Function | `function innerFunction special`, AV r=5 Deckkraft 0.5 | 92 | 96 |
| Inner React JSX Function | `circle-node circle-overlay innerFunction special jsx` (+`function` in AV); KV zusätzlich `inner-circle` r=9 | 112 | 128 |
| Inner Function | `function innerFunction` | 136 | 160 |
| Inner JSX Function | wie JSX-Eintrag ohne `special` | 156 | 192 |
| Composition (AV) / Function Use (KV) | Linie 0.8 `#999` 0.6 mit Pfeil, `x1=1 y1=12 x2=25 y2=12` | 180 | 224 |
| Inheritance (nur AV) | wie oben, `stroke-dasharray 4 2` | 200 | – |

Der Legendenrahmen: rechts unten, Hintergrund `hsla(0,0%,98%,.9)`, Rand oben/links 1 px
`hsla(0,0%,78.4%,.9)`, Ecke oben links 8 px.

## 16. Eigenheiten der Darstellung (bleiben, sofern nicht anders entschieden)

| ID | Eigenheit |
|---|---|
| V1 | Bei „Node sizes based on metrics“ = aus: keine Icons. **Wird korrigiert** (ADR-011 A8). |
| V2 | Knoten ohne Report: Größe 20, keine Icons. |
| V3 | `hasCluster` wird nicht zurückgesetzt (neu korrigiert, ADR-011). |
| V4 | Constraint-Lücke bei Index 0. |
| V5 | Label-/Kantenbreite wird beim Herauszoomen nicht zurückgesetzt. |
| V6 | Vorschaukreise erben die Breite des Elternknotens (Geometrie hängt daran). |
| V7 | Fortschritt/Größe: Balken im Code-Quality-Panel bei > 100 % auf 100 % begrenzt. |
