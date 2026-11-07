# P05-S03 – Regeln: Louvain-Cluster, React-Constraints

Meilenstein M2 · Abhängig von: P05-S01 · Umfang S

## Ziel
Clusterbildung (jLouvain) und WebCola-Constraints für React-Methoden als reine Funktionen.

## Kontext
- §4 (Cluster, V3), §9.2 (Constraints, V4)
- Altcode: `graph.component.ts:323-368, 530-561`

## Dateien
`packages/core/src/rules/cluster.ts` (+ Test), `reactConstraints.ts` (+ Test),
`packages/core/src/types/jlouvain.d.ts` (nur falls die mitgelieferte `jlouvain.d.ts` nicht reicht).

## Schritte
1. `cluster.ts`:
   ```ts
   export type ClusterResult = { clusters: Record<string, number | undefined>; hasCluster: boolean };
   /** Port of GraphComponent.generateCluster. Input: nodes and links of a component view. */
   export function computeClusters(nodes: Node[], links: Array<{ source: Node; target: Node }>): ClusterResult
   ```
   - Knoten-/Kantenfilter und `_constructor`-Abbildung exakt wie §4.
   - `jLouvain` importieren wie im Altsystem (`import { jLouvain } from 'jlouvain'`); falls der
     Bundle-Import zur Laufzeit `undefined` liefert, `cjsDefault`-artige Auflösung für benannte
     Exporte ergänzen und testen.
   - `clusters[node.id]` = Ergebnis für `id === 'constructor' ? '_constructor' : id`.
   - `hasCluster` = `Object.values(raw).some(c => c > 0)` – **pro Aufruf** (ADR-011 A4).
   - Ist das jLouvain-Ergebnis falsy: `{ clusters: {}, hasCluster: false }`.
2. `reactConstraints.ts`: `reactConstraints(nodes: Node[], gap = graphSettings.nodeGap)` →
   `Array<{ axis: 'x'; left: number; right: number; gap: number }>`; Lücke V4 beibehalten
   (`if (!nextNodeIndex) return;`) mit Kommentar.
3. Tests:
   - Cluster: zwei getrennte Paare `a–b`, `c–d` → zwei verschiedene Cluster, `hasCluster true`;
     Knoten `render` und Komponentenknoten bekommen keinen Cluster; `constructor` wird korrekt
     zurückgemappt; leere Kantenliste → `hasCluster false`.
   - Gleiche Eingabe zweimal → gleiches Ergebnis (Determinismus).
   - Constraints: Knoten `[App, render, constructor, componentDidMount]` → Reihenfolge nach
     `reactMethods`: constructor(2) → componentDidMount(3) → render(1): Constraints `{2→3}`, `{3→1}`.
     Fall mit `render` an Index 0 (kein Komponentenknoten) → Lücke V4 sichtbar.

## Akzeptanzkriterien
- [ ] Tests grün; `pnpm check` grün.

## Fallstricke
- jLouvain iteriert über Objekt-Schlüssel – Eingabereihenfolge der Knoten beibehalten.

## Commit-Vorschlag
`feat(core): add Louvain cluster and React constraint rules`
