# P05-S01 – Regeln: Größe, Warnung, Icons

Meilenstein M2 · Abhängig von: M1 · Umfang M

## Ziel
`generateNodeSizes` und `getNodeIcons` des Altsystems als reine, getestete Funktionen in
`@qualivis/core` – ohne DOM, ohne Mutation der Eingabe.

## Kontext
- §1 (Ansicht), §2 (Größe/warn/error), §3 (Icons, exakte Texte), §16 V2; Korrektur von V1 (ADR-011 A8)
- Altcode: `graph.component.ts:245-315` und `:371-470`

## Dateien
`packages/core/src/rules/thresholds.ts` (+ Test), `icons.ts` (+ Test), `nodeVisuals.ts` (+ Test),
`packages/core/src/index.ts` (Exporte).

## Schritte
1. `thresholds.ts`:
   ```ts
   /** Legacy lookup: `${type}.${label || id}` first (checked with !== undefined), then `${type}`. */
   export function resolveThreshold(metricId: string, node: Pick<Node, 'type' | 'label' | 'id'>): number | undefined
   ```
2. `icons.ts`:
   ```ts
   export type IconDescription = { text: string; link?: { href: string } };
   export type VisualIcon = { icon: string; class: 'warn' | 'error'; description: IconDescription };
   export function describeIconText(d: IconDescription): string   // text + (link ? ` (see ${href})` : '')
   export function getNodeIcons(node: Node, report: MetricReport, view: View): VisualIcon[]
   ```
   Reihenfolge, Bedingungen und Texte exakt nach §3. Kommentar mit Verweis auf §3 und
   `graph.component.ts:371-470`. Die zwei Texte mit Link werden zerlegt:
   `{ text: 'Component composition is recommended over inheritance.', link: { href: 'https://reactjs.org/docs/composition-vs-inheritance.html' } }` und
   `{ text: 'Deprecated React lifecycle method', link: { href: 'https://reactjs.org/docs/react-component.html#legacy-lifecycle-methods' } }`.
3. `nodeVisuals.ts`:
   ```ts
   export type View = 'app' | 'component';
   export type VisualOptions = { view: View; sizeMetric: string; nodeSizesBasedOnMetrics: boolean };
   export type NodeVisual = { width: number; height: number; warn: boolean; error: boolean; icons: VisualIcon[] | undefined };
   /** Port of GraphComponent.generateNodeSizes (quirk V2 preserved, V1 corrected: ADR-011 A8). */
   export function computeNodeVisual(node: Node, options: VisualOptions): NodeVisual
   ```
   - Sizes aus (**Korrektur A8**, Altsystem V1 lieferte hier keine Icons): Größe fest
     `width = height = 48`, aber Icons und `warn/error` werden wie unten berechnet (bei vorhandenem Report;
     ohne Report gilt V2).
   - Kein Report: `{ width: 20, height: 20, warn: !!node.warn, error: !!node.error, icons: node.icons }` (V2).
   - Sonst Formel §2 inkl. `+14` in der AV.
   (`node.warn/node.error/node.icons` sind bei frisch kopierten Knoten `undefined` → `false`/`undefined`.)
4. Tests (Verhalten, Zahlen von Hand nachrechenbar):
   - `resolveThreshold('sloc.physical', { type: 'innerFunction', id: 'render' })` → 60;
     `{ type: 'innerFunction', id: 'foo' }` → 40; `{ type: 'component', label: 'render' }` → 200;
     `('sloc.jsx', { type: 'innerFunction', id: 'x' })` → `undefined`.
   - Größe: Komponente in KV mit `sloc.physical = 200` → `sqrt(80 * 200 / π) = 71.36…`; in AV `+14`.
   - warn bei 160 (= 0.8 × 200), nicht bei 159; error bei 200.
   - Icons: Funktion mit `cyclomatic 7` (Schwelle 8, 7 ≥ 6.4) → `warning/warn` mit Funktionstext;
     Komponente mit Fehler in einer Metrik und Warnung in einer späteren → nur `warning/error`
     (Abbruch); `sloc.logical 0` → `delete` (und **kein** `content_cut` ohne-this); Klassenfunktion
     ohne `this` und ohne JSX → `content_cut` helper; `returnsJSX && id !== 'render'` → `content_cut`
     JSX; `extends` → `device_hub`; KV + `componentWillMount` → `report`; AV + `componentWillMount`
     → kein `report`.
   - Reihenfolge mehrerer Icons wie §3.
   - `describeIconText` liefert für die zwei Link-Texte exakt
     `Component composition is recommended over inheritance. (see https://reactjs.org/docs/composition-vs-inheritance.html)`
     bzw. `Deprecated React lifecycle method (see https://reactjs.org/docs/react-component.html#legacy-lifecycle-methods)`.
5. Exporte in `index.ts`.

## Akzeptanzkriterien
- [ ] Alle Fälle oben getestet und grün; `pnpm check` grün.
- [ ] Keine Mutation der Eingabeknoten (Test: `Object.freeze`-Knoten führt nicht zu Fehlern).

## Fallstricke
- `if (!threshold) continue` in `getNodeIcons` prüft Truthiness, `resolveThreshold` dagegen
  `!== undefined` – beides genau so (Schwellenwert 0 kommt nicht vor, aber die Semantik bleibt).
- `nestedStringAccess` wirft bei fehlenden Zwischenobjekten – Altverhalten, nicht abfangen.

## Nicht tun
- Keine React-Typen im Kern.

## Commit-Vorschlag
`feat(core): add node size, warning and icon rules`
