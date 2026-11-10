# P05.5-S02 – Upload: Konfigurationsdateien lesen, ausgeschlossene Ordner überspringen

Ohne Meilenstein (P05.5) · Abhängig von: P05.5-S01 · Umfang S

## Ziel
Der Upload liefert neben den Quelldateien auch `package.json`, `tsconfig*.json` und `jsconfig*.json`.
Beim Hineinziehen steigt er nicht mehr in `node_modules/`, `build/` und `dist/` ab, damit ein ganzer
Monorepo-Ordner schnell eingelesen wird. Das Analyse-Ergebnis bleibt unverändert.

## Kontext
- ADR-019; Architektur §3 (Abhängigkeitsregeln), §4 (Datenfluss)
- `packages/core/src/legacy/isComponentFile.ts`, `packages/core/src/model/files.ts`
  (`excludedFolders`)
- `apps/web/src/features/upload/readDroppedFiles.ts`, `readInputFiles.ts`, `UploadView.tsx`,
  `useFileDrop.ts`
- Schon vorhanden (P05): `apps/web/src/features/upload/isIgnoredUploadPath.ts` überspringt Pfade mit
  einem Ordner `.venv` in beiden Lesewegen (ADR-011 A18).

## Dateien
`packages/core/src/workspace/projectFiles.ts` (+ Test), `packages/core/src/index.ts`,
`apps/web/src/features/upload/readDroppedFiles.ts`, `readInputFiles.ts`, `useFileDrop.ts`,
`UploadView.tsx` (+ Tests), `apps/web/src/app/App.tsx` (oder wo `onFiles` ankommt);
`isIgnoredUploadPath.ts` entfällt.

## Schritte
1. `projectFiles.ts`:
   ```ts
   /** What a folder upload delivers: source files for the analysis, config files for resolving imports. */
   export type ProjectFiles = { sources: SourceFile[]; configs: SourceFile[] };
   /** package.json, tsconfig*.json, jsconfig*.json outside the excluded folders. */
   export function isConfigFile(path: string): boolean
   /** True for a folder path the upload does not descend into (node_modules, build, dist). */
   export function isExcludedFolder(folderPath: string): boolean
   ```
   `isExcludedFolder` prüft `${folderPath}/` gegen `excludedFolders` und übernimmt die Regel für
   `.venv` aus `isIgnoredUploadPath` (ADR-011 A18). Exporte in `index.ts`.
2. `readDroppedFiles`: liefert `ProjectFiles`. Ordner, für die `isExcludedFolder(entry.fullPath)`
   gilt, werden nicht gelesen. Dateien: `isComponentFile` → `sources`, `isConfigFile` →
   `configs`, sonst nichts. Der Rückfallweg ohne `webkitGetAsEntry` filtert genauso.
3. `readInputFiles`: liefert `ProjectFiles` mit derselben Aufteilung. Die Dateiauswahl des Browsers
   zählt `node_modules` trotzdem auf; das lässt sich dort nicht verhindern (RI15).
4. `useFileDrop`, `UploadView` und der Empfänger von `onFiles` reichen `ProjectFiles` weiter.
   `runAnalysis` bekommt bis S07 weiterhin nur `project.sources`.
5. Tests: `isConfigFile` (`/a/package.json` ja, `/a/tsconfig.app.json` ja, `/a/node_modules/x/package.json`
   nein, `/a/src/config.json` nein); `readDroppedFiles` mit Einträgen im Speicher: ein Ordner
   `node_modules` mit Dateien wird nicht gelesen (sein Reader wird nie aufgerufen), Konfigurationen
   landen in `configs`; `readInputFiles` teilt genauso auf.

## Akzeptanzkriterien
- [ ] Beide Lesewege liefern `ProjectFiles`; `sources` ist für `mini` und `realworld` gleich wie vorher.
- [ ] Ausgeschlossene Ordner werden beim Hineinziehen nicht betreten (Test).
- [ ] `pnpm check` grün (G1/G2 unverändert).

## Prüfen
`pnpm check`, `pnpm test:parity`

## Fallstricke
- `readInputFiles` sieht keine Ordner, nur Dateipfade: Dort muss die Regel für `.venv` weiter
  jeden Pfad prüfen, nicht nur den Ordner.
- `entry.fullPath` eines Ordners endet ohne `/`; deshalb `${folderPath}/` prüfen, sonst trifft
  `/dist/` den Ordner `…/dist` nicht.
- Die Kopien von Workspace-Paketen in `node_modules` (pnpm-Links) dürfen nicht mitgelesen werden;
  sonst gäbe es jedes Paket doppelt.

## Nicht tun
- `isComponentFile` und `excludedFolders` nicht ändern (Kern, R5).
- Noch keine Auswahl und keine Auswertung der Konfigurationen.

## Commit-Vorschlag
`feat(web): read config files and skip excluded folders on upload`
