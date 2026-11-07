# P03-S05 – Golden-Test G1, öffentliche API, Paket-README

Meilenstein M1 · Abhängig von: P03-S04 (Goldens liegen seit M0 in `testdata/golden/`) · Umfang M

## Ziel
Der neue Kern reproduziert für `mini` und `realworld` Report, FileMap und App-Graph des Altsystems
exakt. Die öffentliche API ist definiert und dokumentiert.

## Kontext
- `anhang/A5-golden-test-und-diff.md` (Testcode, verifiziert: 6/6 grün im Spike)
- `00-grundlagen/06-teststrategie.md` §3 (Regeln für Goldens)

## Dateien
`packages/core/test/golden/analysis.golden.test.ts`, `loadFixture.ts`, `compare.ts` (+ `compare.test.ts`),
`packages/core/src/index.ts`, `packages/core/README.md`.

## Schritte
1. `loadFixture.ts` und `analysis.golden.test.ts` gemäß A5 (Funktion `loadFixture` in eigene Datei,
   damit G2 sie später nutzt). Vergleich über `expectGoldenEqual` aus `compare.ts` (A5, mit Halstead-Toleranz); die Ist-Werte
   werden bei jedem Lauf nach `.cache/golden-actual/<fixture>/` geschrieben.
2. `pnpm test:parity` ausführen. Erwartet: 6 Tests grün.
3. Falls rot: **nicht** die Goldens ändern. Ist-Ausgabe aus `.cache/golden-actual/` mit
   `tools/golden/diff-json.mjs` vergleichen, Ursache gemäß A5 „Hinweise“ suchen (Pfad-Modul?
   Sortierung? Import geändert?). Bei unklarer Ursache: stoppen, Nutzer informieren.
4. `src/index.ts` – öffentliche API (nur das, was Web/CLI brauchen):
   ```ts
   export { analyzeProject, analyzeProjectAsync } from './analysis/analyzeProject';
   export type { AnalysisResult, AnalyzeAsyncOptions, SourceFile } from './analysis/analyzeProject';
   export { hasSingleComponent } from './analysis/hasSingleComponent';
   export { extractFileTree } from './legacy/extractFileTree';
   export { findReport } from './legacy/findReport';
   export { isComponentFile } from './legacy/isComponentFile';
   export { nestedStringAccess } from './legacy/nestedStringAccess';
   export * from './model/…';   // alle Modell-Typen und Konstanten (wie in S01)
   ```
5. `packages/core/README.md`: Zweck, Beispiel (`analyzeProject([{ path: '/app/src/App.js', code }])`),
   Pfad-Konvention (absolut, `/` als Trenner), Ergebnisstruktur (Verweis auf `model/`), Garantie
   „identisch zum Altsystem, abgesichert durch G1“, Hinweis Babel 7.29/escomplex 0.1/Patches,
   Lizenzhinweis offen (O2).
6. Root-`package.json`: Prüfen, dass `test:parity` die Golden-Tests findet.

## Akzeptanzkriterien
- [ ] `pnpm test:parity` → 6/6 grün (2 Fixtures × 3 Vergleiche).
- [ ] `pnpm check` grün.
- [ ] README beschreibt API und Pfad-Konvention.

## Prüfen
`pnpm test:parity`, `pnpm check`

## Fallstricke
- `JSON.parse(JSON.stringify(...))` ist nötig: Die Goldens kommen aus `localStorage` (keine
  `undefined`-Werte, keine Klasseninstanzen).
- Golden-Dateien sind groß (≈ 30 KB je Report bei `mini`) – Testfehlerausgabe mit `diff-json`
  statt Vitest-Diff lesen.

## Nicht tun
- Keine Toleranzen über die in `06-teststrategie.md` §3 festgelegte hinaus (nur Halstead-
  Fließkommawerte). Jede genutzte Toleranz ist in der Testausgabe sichtbar und wird in `STATUS.md`
  notiert.

## Commit-Vorschlag
`test(core): add golden master G1 against legacy build`
