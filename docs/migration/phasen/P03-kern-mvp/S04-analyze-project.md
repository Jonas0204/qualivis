# P03-S04 – `analyzeProject` und `analyzeProjectAsync`

Meilenstein M1 · Abhängig von: P03-S03 · Umfang M

## Ziel
Eine framework-freie Einstiegsfunktion bildet `DataService.setFiles` 1:1 nach – synchron für Tests,
CLI und Worker, asynchron mit Fortschritt (wie im Altsystem) für die Web-App.

## Kontext
- Altcode: `legacy/angular/src/app/services/data.service.ts:28-91` (Pipeline), `:190-196`
  (`hasSingleComponent`), `:222-229` (Fortschritt)
- `01-referenz-altsystem/02-analyse-kern.md` §1; ADR-006 (Sortierung)

## Dateien
`packages/core/src/analysis/analyzeProject.ts`, `analyzeProject.test.ts`, `sortFiles.ts`,
`sortFiles.test.ts`, `packages/core/src/analysis/hasSingleComponent.ts`.

## Schritte
1. `sortFiles.ts`:
   ```ts
   import type { SourceFile } from './analyzeProject';

   /** Canonical input order (ADR-006): plain code-unit comparison, like Array.prototype.sort(). */
   export function sortFiles(files: readonly SourceFile[]): SourceFile[] {
     return [...files].sort((a, b) => (a.path < b.path ? -1 : a.path > b.path ? 1 : 0));
   }
   ```
2. `hasSingleComponent.ts` – wörtlich nach `data.service.ts:190-196`, aber mit `fileMap` als
   Parameter (statt `this.fileMap$.value`).
3. `analyzeProject.ts` – öffentliche Typen und zwei Funktionen:
   ```ts
   export type SourceFile = {
     /** Absolute project path starting with '/', e.g. '/my-app/src/App.js'. */
     path: string;
     code: string;
   };
   export type AnalysisResult = {
     fileMap: FileMap;
     appGraph: Graph;          // empty ({nodes: [], links: []}) for single-component projects (legacy)
     report: EscomplexReport;
   };
   export type AnalyzeAsyncOptions = {
     /** Called with the cumulated progress in percent (0..100), like the legacy progress bar. */
     onProgress?: (percent: number) => void;
   };
   export function analyzeProject(files: readonly SourceFile[]): AnalysisResult;
   export function analyzeProjectAsync(files: readonly SourceFile[], options?: AnalyzeAsyncOptions): Promise<AnalysisResult>;
   ```
   Ablauf (beide Varianten, gemeinsame Hilfsfunktionen, keine Code-Duplikation):
   1. `sorted = sortFiles(files)`; `componentFiles = sorted.filter(isComponentFile)`
      (`isComponentFile` erwartet `{ path }` – `SourceFile` passt).
   2. Für jede Datei: `ast = parse(code, path)`; `asts.push({ ast, srcPath: path })`;
      `fileMap[path] = { code }`. *(async: danach `await yieldToHost()` und Fortschritt
      `+ (1 / n) * 50`)*
   3. `report = analyzeModules(asts)`.
   4. Für jede Datei: `{ components, defaultExport } = traverse(asts, path, report)`, in `fileMap`
      eintragen. *(async: yield + Fortschritt wie oben)*
   5. `fileMap` filtern wie `data.service.ts:59-66` (Komponenten vorhanden **oder** `defaultExport`
      beginnt mit `/`). Reihenfolge der Schlüssel bleibt (Objekt-Einfügereihenfolge).
   6. Reports an Knoten hängen wie `data.service.ts:71-81` (`findReport(report, fileMap, fileName,
      componentName, node.id)`).
   7. `appGraph = hasSingleComponent(fileMap) ? { nodes: [], links: [] } :
      generateAppGraph(fileMap, componentFiles, report)`.
   `yieldToHost = () => new Promise<void>(resolve => setTimeout(resolve, 0))`.
   Fortschritt: Werte wie im Altsystem kumuliert; am Ende **kein** zusätzlicher Aufruf (die UI
   blendet den Balken aus, wenn die Promise erfüllt ist).
4. `analyzeProject.test.ts` (Verhalten, kleine Inline-Projekte):
   - Leere Eingabe → `fileMap` `{}`, `appGraph` leer, kein Fehler.
   - Nicht-Komponenten-Dateien (`/p/README.md`, `/p/src/a.test.js`, `/p/node_modules/x/index.js`,
     `/p/src/util.js` ohne JSX) erscheinen nicht in `fileMap`.
   - Projekt mit genau einer Komponente → `appGraph` leer, `fileMap` mit einer Datei, Graph der
     Komponente vorhanden.
   - Zwei Komponenten mit Import (`App` rendert `<Child />`) → `appGraph` mit 2 Knoten, 1 Kante
     `App → Child`, IDs `'/p/src/App.js#App'`.
   - Eingabe in umgekehrter Reihenfolge liefert **identisches** Ergebnis (`toEqual`).
   - `analyzeProjectAsync`: gleiches Ergebnis wie sync; `onProgress`-Werte streng steigend, letzter
     Wert ≈ 100 (Toleranz 1e-9), Anzahl Aufrufe = 2 × Anzahl Komponentendateien.
   - Syntaxfehler in einer Datei → Funktion wirft (wie Altsystem; Fehlerbehandlung kommt in P08-S05).

## Akzeptanzkriterien
- [ ] Alle Tests grün; `pnpm check` grün.
- [ ] Keine Logik aus `legacy/` dupliziert oder verändert; `analyzeProject.ts` ≤ 120 Zeilen.

## Prüfen
`pnpm --filter @qualivis/core test`

## Fallstricke
- Altsystem prüft `file.components && Object.keys(...).length > 0` – exakt so übernehmen.
- `Object.fromEntries` statt des alten `reduce(Object.assign)` ist erlaubt (gleiches Ergebnis,
  gleiche Reihenfolge).

## Nicht tun
- Keine Optionen „für später“ (Worker, Fehler überspringen) – kommen in P08.

## Commit-Vorschlag
`feat(core): add analyzeProject and analyzeProjectAsync`
