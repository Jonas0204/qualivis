# P06-S02 – Auswahlmodell (Port von `DataService`)

Meilenstein M3 · Abhängig von: P06-S01 · Umfang M

## Ziel
Auswahl von Knoten, Vorschaukreisen und Dateien erzeugt genau die `NodeSelection`-Objekte des
Altsystems (inkl. Code und Zeilenbereich), damit Panels und Quelltext korrekt reagieren.

## Kontext
- Altcode: `data.service.ts:117-160` (`selectNode`, `deselectNodes`, `selectFile`), `:198-205`
  (`getComponentName`), `:231-264` (`findNamesById`, `findComponentOrFunctionById`, `findCode`)
- Funktionsinventar Q5 (Altsystem: keine Icons bei Dateiauswahl – **wird korrigiert**, ADR-011 A9), S1

## Dateien
`apps/web/src/state/selection.ts` (reine Funktionen) + `selection.test.ts`,
`apps/web/src/state/selectionAtoms.ts` (erweitern), Anbindung in `GraphView`.

## Schritte
1. Reine Funktionen (1:1-Logik, `fileMap` und `report` als Parameter statt Service-Zustand):
   ```ts
   export function findNamesById(fileMap: FileMap, componentId: string | undefined, nodeId?: string): { fileName?: string; componentName?: string; functionName?: string }
   export function createNodeSelection(fileMap: FileMap, node: Pick<Node, 'id' | 'label' | 'type' | 'report' | 'icons'>, componentId: string | undefined): NodeSelection
   export function createFileSelection(fileMap: FileMap, report: EscomplexReport, fileName: string): NodeSelection[]
   export function getComponentName(fileMap: FileMap, fileName: string): string | undefined
   ```
   - `createNodeSelection`: `code` = ganzer Dateiinhalt (`findCode`), `lineStart/lineEnd` vom Knoten
     der Komponente (Funktion) bzw. der Komponente; Icons vom übergebenen Knoten.
   - `createFileSelection`: je Komponente der Datei `{ id: file#comp, label: comp, type: 'component',
     report: findReport(...), icons, code, lineStart, lineEnd }`; `icons` = Icons des Knotens mit
     derselben ID im App-Graph (über `buildViewModel`, Ansicht `app`), sonst `[]` (Korrektur A9; das
     Altsystem lieferte immer `[]`). Dafür bekommt die Funktion die Icons per Parameter
     `iconsById: Map<string, VisualIcon[]>`.
   - Eigenheiten unverändert (z. B. `findNamesById`-Zweig für Single-Komponenten-Projekte).
2. `selectionAtom` + Schreib-Atome/Funktionen: `selectNode(node, componentId)`, `selectFile(fileName)`,
   `deselect()` (Altsystem setzt `null`).
3. `GraphView`: Knoten-Klick → `selectNode(d, componentId)`; Vorschaukreis-Klick →
   `selectNode(f, f.componentId = parent.id)`; Hintergrund → `deselect()`.
4. Tests mit dem `mini`-Ergebnis:
   - AV, Klick auf `App` → `id '/mini/src/App.js#App'`, `lineStart 8`, `lineEnd 72` (Zeilen der Klasse
     im Fixture; 72 − 8 + 1 = 65 = `sloc.physical` im Golden), `code` = Dateiinhalt.
   - KV `App`, Klick auf `render` → Zeilen von `render`.
   - Vorschaukreis `handleClick#11` von `Counter` in der AV → Zeilen der Funktion.
   - `selectFile('/mini/src/components/TodoList.jsx')` → zwei Einträge (`TodoList`,
     `ConnectedTodoList`); `selectFile('/mini/src/components/Header.js')` → Icons enthalten `device_hub` (A9).
   - `getComponentName` → `undefined` bei mehreren Komponenten.

## Akzeptanzkriterien
- [ ] Tests grün (Werte aus dem Fixture abgeleitet und im Test kommentiert).
- [ ] `pnpm check` grün.

## Fallstricke
- Grundform aus P05 (`state/selectionAtoms.ts`): `SelectedNode` sind die Felder `id`, `label`,
  `type`, `report`, `icons` des Ansichtsmodells; die Icons sind also `VisualIcon` (Beschreibung
  als Objekt) statt `NodeIcon` (HTML-Text). `selectGraphNodeAtom` nimmt noch keine `componentId`.
- Ein Klick auf einen Vorschaukreis hat noch keinen Handler (`PreviewCircles.tsx`): Er blendet nur
  auf die Komponente aus, die alte Auswahl bleibt. Schritt 3 ergänzt ihn (Funktionsinventar G4).
- Die Zeilen von `App` vorher im Fixture nachzählen (Klasse beginnt bei `export default class`).
  Im Spike war die CodeMirror-Auswahl des Altsystems `head.line 7`, `anchor.line 72` (0-basiert,
  `setSelection({line: lineEnd}, {line: lineStart - 1})`) → `lineStart 8`, `lineEnd 72`.

## Commit-Vorschlag
`feat(web): port node and file selection model`
