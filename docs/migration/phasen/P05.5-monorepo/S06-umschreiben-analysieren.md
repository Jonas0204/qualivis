# P05.5-S06 – Kern: Importe umschreiben und analysieren

Ohne Meilenstein (P05.5) · Abhängig von: P05.5-S05 · Umfang M

## Ziel
`analyzeWorkspaceAsync` analysiert eine App aus einem Monorepo: Auswahl (S05), auflösbare
Import-Angaben in relative Pfade mit Endung umschreiben, alter Kern, Originalcode zurück ins
Ergebnis. Für `monorepo` entstehen genau die erwarteten Knoten und Kanten.

## Kontext
- ADR-019; K4, K12; Analyse-Kern §1, §4 (FileMap enthält `code`)
- `packages/core/src/analysis/analyzeProject.ts` (`analyzeProjectAsync`, `AnalysisResult`)
- `packages/core/src/legacy/traverseHelper.ts:140-159` (`getAbsolutePath`: versteht `./` und `../`)
- S05, `testdata/fixtures/monorepo.NOTES.md`

## Dateien
`packages/core/src/workspace/rewriteImports.ts`, `analyzeWorkspace.ts` (je + Test),
`packages/core/src/index.ts`.

## Schritte
1. `rewriteImports.ts`:
   ```ts
   /** Replaces every resolvable, not type-only specifier by a relative path with extension. */
   export function rewriteImports(file: SourceFile, resolve: ImportResolver): SourceFile
   ```
   Neue Angabe: `posix.relative(dirname(file.path), target)`, mit `./` davor, wenn sie nicht mit
   `.` beginnt. Nur den Inhalt zwischen den Anführungszeichen ersetzen (gleiche Art Anführungszeichen,
   gleiche Zeile); von hinten nach vorn, damit die Offsets stimmen. Unauflösbare und Typ-Importe
   bleiben.
2. `analyzeWorkspace.ts`:
   ```ts
   export type WorkspaceChoice = { appDir: string };
   export function analyzeWorkspaceAsync(
       project: ProjectFiles,
       choice: WorkspaceChoice,
       options?: AnalyzeAsyncOptions
   ): Promise<AnalysisResult>
   ```
   Ablauf: `createImportResolver` → `selectAppFiles` → `rewriteImports` je Datei →
   `analyzeProjectAsync(rewritten, options)` → in `result.fileMap` für jede Datei `code` wieder auf
   den Originalcode setzen (die Zeilen sind gleich, Bereiche im Quelltext-Panel passen also).
3. Exporte in `index.ts`.
4. Tests:
   - `rewriteImports`: `'@demo/ui/components/button/Button'` aus `Header.tsx` wird
     `'../../../../shared/ui/src/components/button/Button.tsx'`; `"./Header"` (doppelte
     Anführungszeichen) wird `"./Header.tsx"`; `react` und `import type` bleiben; Zeilenzahl gleich.
   - `analyzeWorkspaceAsync(monorepo, { appDir: '/monorepo/apps/web-a' })`: Knoten und Kanten des
     App-Graphen genau wie in `monorepo.NOTES.md`; `fileMap[…/Header.tsx].code` ist der Originalcode.
   - Gleicher Test für `web-b`.
   - Alter Weg: `analyzeProjectAsync(monorepo.sources)` liefert die Erwartung „Whole project“ aus
     `monorepo.NOTES.md` (belegt K12 und dass der alte Weg unverändert bleibt).

## Akzeptanzkriterien
- [ ] Alle Fälle oben getestet und grün.
- [ ] `pnpm check` und `pnpm test:parity` grün (G1/G2 unverändert).

## Prüfen
`pnpm check`, `pnpm test:parity`

## Fallstricke
- Die Endung in der neuen Angabe ist Absicht: Der alte Kern sucht ohne Endung per Präfix (K12) und
  fände sonst `Button.styles.ts`. Mit Endung trifft er genau.
- Halstead-Werte können sich minimal ändern, wenn zwei verschiedene Angaben nach dem Umschreiben
  gleich lauten (ein unterschiedlicher Operand weniger). Hinnehmen, in der Notiz erwähnen.
- Der Fortschritt (`onProgress`) gilt nur für die Analyse; Auswahl und Umschreiben laufen vorher.

## Nicht tun
- Nichts in `packages/core/src/legacy/` ändern (R5); keine Goldens anfassen (R6).
- Keine Unterscheidung von App- und Bibliotheksknoten im Ergebnis (O17).

## Commit-Vorschlag
`feat(core): analyse one app of a monorepo with resolved imports`
