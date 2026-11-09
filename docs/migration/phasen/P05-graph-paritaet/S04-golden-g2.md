# P05-S04 – Golden G2 (Regeln gegen Altsystem)

Meilenstein M2 · Abhängig von: P05-S01–S03 · Umfang M

## Ziel
Für AV und jede KV beider Fixtures liefern die Kernregeln dieselben Werte wie das Altsystem:
Breite, warn/error, Icons, Cluster, Vorschaukreise, „...“, Kantenliste.

## Kontext
- `00-grundlagen/06-teststrategie.md` §3 (G2-Vergleichsregeln)
- Goldens: `legacy-dom-app.json`, `legacy-dom-component-*.json` (Format: `snapshot()` in `tools/legacy/capture.browser.js`)

## Dateien
`packages/core/src/rules/viewModel.ts` (+ Test), `packages/core/test/golden/rules.golden.test.ts`.

## Schritte
1. `viewModel.ts` – fasst zusammen, was `GraphView` später braucht (eine Stelle, testbar):
   ```ts
   export type ViewModelOptions = VisualOptions & { showCluster: boolean };
   export type VisualNode = Node & { width: number; height: number; warn: boolean; error: boolean; icons?: VisualIcon[]; cluster?: number };
   export type ViewModel = { nodes: VisualNode[]; links: Array<{ source: VisualNode; target: VisualNode; inherits?: boolean }>; hasCluster: boolean; constraints: ReturnType<typeof reactConstraints> };
   export function buildViewModel(graph: Graph, options: ViewModelOptions): ViewModel
   ```
   Ablauf wie `createSimulation` (§9, `graph.component.ts:563-569`): tiefe Kopie per
   `JSON.parse(JSON.stringify(graph))` (wie Altsystem; `structuredClone` ist im DOM-freien Kern nicht
   typisiert) → Visuals →
   (nur KV) Cluster → (nur KV) Constraints → Kanten auflösen. Kanten, deren Quell- oder Zielknoten
   fehlt, mit dem Konsolenfehler des Altsystems weglassen, wie `resolveLinks` in
   `apps/web/src/features/graph/buildViewGraph.ts`: Das Altsystem behielt sie, und d3 brach dann mit
   „node not found“ ab (Nutzer, 09.11.2026). In `mini` und `realworld` kommt das nicht vor.
2. `rules.golden.test.ts`:
   - Für jedes Fixture: `analyzeProject(loadFixture(f))`.
   - AV: `buildViewModel(appGraph, { view: 'app', sizeMetric: 'sloc.physical', nodeSizesBasedOnMetrics: true, showCluster: false })`
     gegen `legacy-dom-app.json` (Knoten in derselben Reihenfolge, über `id` zugeordnet).
   - Jede KV-Datei: `componentId` aus dem Dateinamen bzw. `snapshot.nodes[0]`/URL ableiten
     (im Snapshot steht `url` mit `?id=`; `decodeURIComponent`), Graph aus `fileMap`, `view: 'component'`.
   - Verglichen je Knoten: `width` (±1e-9), `warn`, `error`, `cluster` (`undefined` ↔ `null`),
     Icons (`icon`, `class`, Text: `describeIconText(new)` === normalisierter Legacy-Text, Normalisierung
     = Tags entfernen, Leerraum zu einem Leerzeichen, trim).
   - AV zusätzlich: `previewCircles(node.width, node.functions)` gegen `dom.previews` (Klasse, Titel,
     `hidden`, `cx/cy` ±1e-9) und `previewDots` gegen `dom.dots`.
   - Kanten: Liste `[source.id, target.id, inherits]` exakt gleich (Reihenfolge inklusive).
   - KV: `hasCluster` gegen `hasClusterButton` **nur, wenn** der Legacy-Wert nicht von V3 betroffen
     ist: Wenn Legacy `true` meldet, aber kein Knoten einen Cluster > 0 hat, ist das V3 → Test
     akzeptiert `false` und kommentiert es.
3. Fehlermeldungen des Tests so formulieren, dass Knoten-ID und Feld sichtbar sind
   (`expect(actual, `${fixture} ${view} ${id} width`).toBeCloseTo(...)`).

## Akzeptanzkriterien
- [ ] G2 grün für `mini` (AV + 4 KVs) und `realworld` (AV + alle KVs).
- [ ] `pnpm test:parity` umfasst G1 und G2; `pnpm check` grün.

## Fallstricke
- `labels` sind in KVs der Klassen leer (`label: null`), IDs sind Methodennamen.
- `ConnectedTodoList` (K5): Breite 20, keine Icons – muss auch neu so herauskommen.

## Nicht tun
- Keine Toleranz außer bei Fließkommazahlen.

## Commit-Vorschlag
`test(core): add golden master G2 for visual rules`
