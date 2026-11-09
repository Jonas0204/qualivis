# P04-S05 – Minimaler Graph mit Kraft-Layout

Meilenstein M1 · Abhängig von: P04-S04 · Umfang M

## Ziel
Die Graph-Ansicht zeigt den App-Graph (bzw. bei genau einer Komponente deren Graph) als SVG:
Kreise (Radius 24), Labels, Pfeile; Kraft-Layout mit den Parametern des Altsystems; der Inhalt wird
automatisch in die Fläche eingepasst. Das ist das **erste sichtbare Produkt (M1)**.

## Kontext
- `01-referenz-altsystem/03-visuelle-regeln.md` §8 (Kanten, Marker), §9.3 (Kraft-Layout)
- `00-grundlagen/03-architektur.md` §6 (LayoutEngine-Schnittstelle)
- Altcode: `graph.component.ts:563-656`, `graph.component.html:1-30`, `helper/generateLinkReferences.ts`,
  `data.service.ts:93-115` (welcher Graph)

## Dateien
```
apps/web/src/features/graph/buildViewGraph.ts      buildViewGraph.test.ts
apps/web/src/features/graph/layout/types.ts
apps/web/src/features/graph/layout/forceLayout.ts  forceLayout.test.ts
apps/web/src/features/graph/useLayout.ts
apps/web/src/features/graph/GraphView.tsx          GraphView.test.tsx
apps/web/src/features/graph/GraphCanvas.tsx        GraphCanvas.test.tsx
apps/web/src/features/graph/graph.css
apps/web/src/features/graph/useElementSize.ts
```

## Schritte
1. `buildViewGraph(result, componentId)` → `{ nodes, links, view: 'app' | 'component' }`:
   Logik von `setComponentGraph` (`data.service.ts:93-115`) + `isComponentView`
   (`!!componentId || hasSingleComponent(fileMap)`). Rückgabe ist eine **tiefe Kopie**
   per `JSON.parse(JSON.stringify(...))` – genau wie im Altsystem (verwirft `undefined`-Werte; kein
   `structuredClone`, um identische Daten zu behalten), weil das Layout Knoten mutiert (Altsystem:
   `graph.component.ts:166-171`). Kanten werden auf Knotenobjekte aufgelöst (Port von
   `generateLinkReferences`, inkl. Konsolenfehler bei fehlenden Knoten).
   Tests: App-Graph für `mini` (8/7), Single-Komponenten-Projekt → dessen Graph, ungültige
   `componentId` → App-Graph.
   Dazu in `state/viewAtoms.ts` das abgeleitete Atom
   `viewGraphAtom = atom(get => { const r = get(analysisAtom).result; return r ? buildViewGraph(r, get(componentIdAtom)) : undefined; })`
   (Architektur §5). `GraphView` liest nur dieses Atom.
2. `layout/types.ts`: Schnittstelle `LayoutEngine` (Architektur §6).
3. `forceLayout.ts` – `createForceLayout({ nodes, links, width, height, force? })`:
   - Parameter exakt nach §9.3 (Ladung `Math.min(-4000 + n * 200, -400)`, Link-Distanz 100,
     Zentrum, Kollision `(width / 2) * 1.2`). Bis P05 haben alle Knoten `width = height = 48`.
   - `onTick`, `onEnd` über `simulation.on('tick.qv', …)` / `('end.qv', …)`.
   - `dragStart/drag/dragEnd` gemäß §11 (für P05 vorbereitet, hier schon implementieren und testen:
     `dragEnd(node, { pin: false })` setzt `fx = fy = null`).
   - Test: Nach `simulation.tick(300)` (über eine Testhilfe `runToEnd()`) liegen alle Knoten
     innerhalb von ±2000 px um das Zentrum, keine `NaN`; zwei verbundene Knoten sind näher als zwei
     unverbundene (Verhalten des Kraftmodells).
4. `useLayout(engineFactory, deps)`: erzeugt Engine in `useEffect`, startet, zählt Ticks in State
   (höchstens einmal pro `requestAnimationFrame`), stoppt beim Aufräumen. Gibt `{ version, ended }`
   zurück.
5. `useElementSize(ref)`: `ResizeObserver` → `{ width, height }`.
6. `GraphCanvas({ nodes, links, viewBox })` – reine Anzeige:
   ```
   <svg class="qv-graph" role="img" aria-label="Component graph" viewBox=…>
     <defs> <marker id="arrowhead" …>  (Werte aus §8) </defs>
     <g class="links" stroke="#999" stroke-opacity="0.6"> <line … marker-end="url(#arrowhead)"> </g>
     <g class="nodes"> <g class="node" transform="translate(x, y)">
        <circle class="circle-node component" r="24"/> <circle class="circle-overlay component" r="24" fill="transparent" stroke-width="1"/>
        <text class="node-label">label || id</text></g> </g>
   </svg>
   ```
   Kanten-Endpunkt nach §8 verkürzt (`mainRadius = 24`, `+0.5`); diese Rechnung als reine Funktion
   `shortenToTarget(source, target, radius)` in `features/graph/geometry.ts` mit Unit-Test
   (bekannte Werte: Quelle (0,0), Ziel (100,0), Radius 24.5 → Ende (75.5, 0)).
7. `GraphView`: liest `viewGraphAtom`, startet Layout, berechnet `viewBox` aus
   den aktuellen Knotengrenzen (min/max ± 48 px Rand) – **vorläufiger Ersatz für Zoom-to-fit**
   (wird in P05-S07 durch Pan/Zoom ersetzt).
8. `graph.css`: Farben für `.circle-node.component`, `.circle-overlay.component` aus Stil-Referenz
   §1 (Graph-Tabelle), Label 14 px `dominant-baseline: central; text-anchor: middle;
   pointer-events: none`, Hintergrund der Fläche `--qv-background`.
9. `App.tsx`: `viewModeAtom === 'graph'` → `GraphView`.
10. Tests:
    - `GraphCanvas` mit festen Positionen: Anzahl `g.node` = Knoten, Labels in Reihenfolge,
      Anzahl `line` = Kanten, jede Linie hat `marker-end`.
    - `GraphView` mit Fake-Engine (setzt Positionen sofort und meldet `end`): rendert 8 Knoten für
      das `mini`-Ergebnis.

## Akzeptanzkriterien
- [ ] `realworld` laden → 32 Kreise mit Labels und 36 Pfeilen sichtbar, Layout bewegt sich kurz und
      kommt zur Ruhe, alles ist im Bild.
- [ ] Tests grün; `pnpm check` grün.

## Prüfen
`pnpm check`, `pnpm dev`

## Fallstricke
- `d3-force` erwartet in `forceLink` entweder Indizes/Objekte oder `.id()`. Wir übergeben aufgelöste
  Objekte (wie das Altsystem) – **ohne** `.id()`.
- React StrictMode ruft Effekte doppelt auf: Engine im Aufräumen sauber stoppen, sonst laufen zwei
  Simulationen.
- `viewBox` bei 0 Knoten: kein `NaN` (Fallback `0 0 1 1`).

## Nicht tun
- Kein WebCola, keine Größen nach Metrik, kein Zoom (alles P05).

## Commit-Vorschlag
`feat(web): render app graph with force layout (M1)`
