# P05-S05 – Knoten- und Kanten-Rendering, Graph-CSS

Meilenstein M2 · Abhängig von: P05-S04 · Umfang M

## Ziel
`GraphCanvas` rendert Knoten und Kanten mit derselben SVG-Struktur, denselben Klassen und Farben wie
das Altsystem – gespeist aus `buildViewModel`.

## Kontext
- §5–§8, §14 (Auswahl-Darstellung); Stil-Referenz §1 (Graph-Farben)
- Altcode: `graph.component.ts:658-950`, `graph.component.html:1-30`, `graph.component.scss`

## Dateien
`apps/web/src/features/graph/GraphNode.tsx` (+ Test), `GraphLink.tsx` (+ Test),
`PreviewCircles.tsx`, `GraphDefs.tsx`, `GraphCanvas.tsx` (umbauen), `GraphView.tsx` (auf
`buildViewModel` umstellen), `graph.css` (vollständig).

## Schritte
1. `GraphDefs`: Marker `#arrowhead` und Muster `#diagonalHatch` (§8; Linie Strichbreite 2,
   Deckkraft 0.6). IDs pro Instanz eindeutig machen (`useId()`), weil später mehrere SVGs (Legende)
   dieselben Defs nutzen – Legende referenziert die des Graphen wie im Altsystem (gleiches Dokument);
   daher: Defs **einmal** im Graph-SVG, Legende verwendet `url(#<id>)` derselben ID (ID über Context
   weiterreichen).
2. `GraphNode({ node, view, selected, settings, clusterFill, clusterStroke, onClick, … })` rendert in
   genau dieser Reihenfolge (wie `createNodes`, `graph.component.ts:673-683`):
   1. `circle.circle-node` (`r = mainRadius`), Klassen `circle-node <type>` + ` selected` + ` special`,
      Inline-Füllung nur bei Clusterfarbe.
   2. `circle.circle-overlay` (Füllung Schraffur oder `transparent`; Klassen inkl. `warn/error` nur bei
      `currentSizeMetricErrorHighlighting`; `stroke-width` 2 wenn ausgewählt, sonst 1; Klick = Auswahl).
   3. `circle.inner-circle` nur bei `returnsJSX` (`r = mainRadius - 3`).
   4. AV: `<g>` mit Vorschaukreisen (`PreviewCircles`, Radius 3, Deckkraft 0.5, `display:none` bei
      `hidden`, `<title>` = ID, Klick wählt Funktion) und ggf. `text.dots` „...“.
   5. Label (nur bei `settings.text`): `text.node-label` → `tspan.label-text` + `tspan` (`dy=1.2em`,
      `x=0`) mit `tspan.icon <class>` je Icon.
   Wrapper `g.node` mit `transform="translate(x, y)"`, `cursor: pointer`.
3. `GraphLink({ link, … })`: `line` mit `x1/y1` = Quelle, `x2/y2` = `linkEnd(...)`,
   `stroke-width 0.8` (bzw. Zoom-Kappung, S07), `stroke-dasharray="4 2"` bei `inherits`,
   `marker-end`. Kanten mit `NaN`-Koordinaten (Distanz 0) nicht rendern.
4. `graph.css` – alle Regeln aus der kompilierten Altdatei (Stil-Referenz §1, Tabelle „Graph“), unter
   `.qv-graph` geschachtelt; Icons: `font-family: var(--qv-font-icons); text-anchor: middle;
   dominant-baseline: central`, Farben `--qv-warn/--qv-error`; `.dots { font-size: 8px; text-anchor: middle }`;
   `.node-label { pointer-events: none }` (Klicks gehen an `tspan.label-text`: `pointer-events: auto`).
5. `GraphView`: `buildViewModel(graph, { view, sizeMetric, nodeSizesBasedOnMetrics, showCluster })`;
   Layout (noch das Kraft-Layout aus `features/graph/layout/forceLayout.ts`, jetzt mit echten
   Breiten) bekommt die `VisualNode`s, und zwar als eigene Kopie je Layout-Lauf, nicht als Wert eines
   Atoms: d3 schreibt `x`, `y`, `vx`, `vy`, `fx`, `fy` und `index` in Knoten und Kanten (Architektur
   §5; das Altsystem kopiert bei jeder Graph-Emission, `graph.component.ts:166-171`). Bisher schreibt
   das Kraft-Layout in den zwischengespeicherten Wert von `viewGraphAtom` (Review P04).
6. Tests (jsdom, feste Positionen):
   - Klassenkomponente in AV: Overlay mit `fill="url(#…)"`, Funktionskomponente `transparent`.
   - JSX-Funktion in KV: `inner-circle` mit `r = mainRadius - 3`.
   - Ausgewählter Knoten: `circle-node … selected`, Overlay `stroke-width="2"`.
   - Icons: `tspan.icon.warn` mit Text `warning`.
   - Vorschau: Anzahl Kreise = Funktionen; ausgeblendete haben `display: none`; „...“ vorhanden, wenn
     einer ausgeblendet ist.
   - Inline-Snapshot eines Knotens (Funktionskomponente, ein Icon, zwei Vorschaukreise) –
     dient als Regressionstest des Markups.

## Akzeptanzkriterien
- [ ] `mini` und `realworld`: Knoten haben dieselben Größen, Farben, Schraffuren, Icons und
      Vorschaukreise wie im Altsystem (Sichtvergleich, Layout darf abweichen).
- [ ] Tests grün; `pnpm check` grün.

## Fallstricke
- SVG-Attribut `class` → in React `className`; `stroke-dasharray` → `strokeDasharray` usw.
- Reihenfolge der SVG-Elemente bestimmt die Überdeckung – nicht umsortieren.
- Clusterfarben nur in der KV und nur bei `showCluster` (S11 liefert den Schalter).

## Nicht tun
- Kein Inline-Style für normale Farben (nur Klassen); Inline nur für Clusterfarben.

## Commit-Vorschlag
`feat(web): render nodes and links like the legacy graph`
