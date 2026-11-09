# P05.5-S05 – Kern: erreichbare Dateien auswählen

Ohne Meilenstein (P05.5) · Abhängig von: P05.5-S04 · Umfang M

## Ziel
Vom gewählten App-Ordner aus sammelt der Kern alle Quelldateien, die über Importe erreichbar sind,
auch in anderen Paketen. Testdateien und reine Typ-Importe zählen nicht. Nur diese Dateien werden
später analysiert.

## Kontext
- ADR-019; Analyse-Kern §1 (Pipeline), ADR-006 (kanonische Reihenfolge)
- `packages/core/src/legacy/parser.ts` (gleiche Parser-Plugins wie die Analyse)
- S04 (`createImportResolver`), Testprojekt `monorepo`

## Dateien
`packages/core/src/workspace/scanImports.ts`, `selectFiles.ts` (je + Test),
`packages/core/src/index.ts`.

## Schritte
1. `scanImports.ts`:
   ```ts
   export type ImportReference = {
       specifier: string;
       /** Offsets of the string literal including its quotes. */
       start: number;
       end: number;
       typeOnly: boolean;
   };
   /** Import and re-export specifiers at the top level of a file. */
   export function scanImports(file: SourceFile): ImportReference[]
   ```
   Mit `parse` aus `legacy/parser.ts` parsen und nur `program.body` durchgehen:
   `ImportDeclaration`, `ExportNamedDeclaration` und `ExportAllDeclaration` mit `source`.
   `typeOnly`: `importKind`/`exportKind === 'type'` oder alle Specifier sind `type`-Specifier.
   Parse-Fehler: `console.error` mit Pfad, leere Liste (die Analyse meldet den Fehler später selbst).
2. `selectFiles.ts`:
   ```ts
   /** __tests__/, __mocks__/, .test., .spec., .stories. */
   export function isTestFile(path: string): boolean
   /** Source files of the app folder (without tests and .d.ts) and everything they import, sorted. */
   export function selectAppFiles(project: ProjectFiles, appDir: string, resolve?: ImportResolver): SourceFile[]
   ```
   Start: alle Quelldateien unter `appDir + '/'`, ohne Tests und ohne `.d.ts`. Breitensuche über
   alle nicht `typeOnly`-Referenzen, die der Resolver auflöst; Testdateien werden nie aufgenommen.
   Ergebnis nach Pfad sortiert wie `sortFiles`. `resolve` fehlt → `createImportResolver(project)`.
3. Exporte in `index.ts`.
4. Tests:
   - `scanImports`: Default-, Namens-, Namespace-, Side-Effect-Import; `import type`; `import { type A }`;
     `export { x } from`; `export * from`; dynamisches `import()` wird nicht gemeldet; `start`/`end`
     zeigen auf die Anführungszeichen.
   - `selectAppFiles(monorepo, '/monorepo/apps/web-a')`: genau die App-Dateien `main.tsx`,
     `routes.ts`, `Page.tsx`, `Header.tsx`, `Header.styles.ts` (Startdateien sind alle Quelldateien
     der App) und die erreichten `dev-data/sample.ts`, `Card.tsx`, `Button.tsx`, `Button.styles.ts`,
     `Icon.tsx`, `useToggle.ts`. Der Typ-Import von `types.ts` zählt nicht; kein `Unused`, keine
     Tests, nichts aus `web-b` oder `tokens`.
   - `isTestFile`: `/a/__tests__/XTest.tsx` ja, `/a/x.spec.ts` ja, `/a/Contest.tsx` nein.

## Akzeptanzkriterien
- [ ] Alle Fälle oben getestet und grün.
- [ ] `pnpm check` grün.

## Prüfen
`pnpm check`

## Fallstricke
- Der Scan ist nur ein Parse ohne `traverse`; bei mehreren hundert Dateien muss das schnell bleiben
  (RI14). Nicht die volle Analyse zum Sammeln nutzen.
- Testdateien mit Suffix `Test` außerhalb von `__tests__/` werden nicht erkannt (O18); eine
  Komponente `Contest.tsx` darf nicht als Test gelten.

## Nicht tun
- Keine Änderung an `legacy/parser.ts` (R5).
- Noch kein Umschreiben und keine Analyse (S06).

## Commit-Vorschlag
`feat(core): select the files an app reaches through its imports`
