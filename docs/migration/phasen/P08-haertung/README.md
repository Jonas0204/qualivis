# P08 – Härtung und Qualität (Meilenstein M5)

**Ziel:** Nach erreichter Funktionsparität wird die Codebasis robuster, strenger typisiert, besser
getestet, barrierearm, sicher konfiguriert und auch für große Projekte flüssig.

> Diese Phase liegt nach dem MVP. Die Karten sind bewusst kompakter. **Vor Beginn** wird jede Karte
> (wie in P01–P07) zu einer eigenen Datei `Sxx-….md` ausgearbeitet (Schritt S00), weil sich bis
> dahin Details aus der Umsetzung ergeben.

## S00 – Phase verfeinern (S)
Karten S01–S09 als Einzeldateien im Format aus `00-grundlagen/05-konventionen.md` §9 ausarbeiten,
Erkenntnisse aus `STATUS.md` (Abweichungen, offene Punkte) einarbeiten, mit dem Nutzer abstimmen.

## S01 – Kern: `noImplicitAny` und Report-Typen (M)
- `packages/core/tsconfig.src.json`: `noImplicitAny: true`. Fehler im Altcode nur mit Typannotationen
  beheben (Parameter-Typen wie `path: NodePath<t.ClassDeclaration>`; bei Unklarheit `NodePath`).
- `model/report.ts` präzisieren (Methoden-, Klassen-, Modul-Report gemäß escomplex-Struktur, siehe
  Golden `legacy-report.json`); Index-Signaturen entfernen, wo möglich.
- **Abnahme:** G1/G2/G4 grün, keine Laufzeitänderung (Diff-Review), `pnpm check` grün.

## S02 – Kern: Lint-Regeln im Altcode schrittweise aktivieren (S)
- Nur Regeln aktivieren, deren Autofix das Verhalten nachweislich nicht ändert (z. B. `useImportType`;
  `useTemplate` nur nach Prüfung, dass nur Strings verkettet werden). **Nicht** aktivieren:
  `useOptionalChain` (macht aus einem Absturz ein `undefined` → Verhaltensänderung).
  Pro Regel: aktivieren → `biome check --write` → G1/G2 → Diff-Review → Commit.
- Kognitive Komplexität im Altcode bleibt aus (ADR-002/Leitplanke). Ein Refactoring wäre ein eigenes
  Vorhaben mit ADR.

## S03 – Fixture `features` und Fall-Tests der Erkennung (M)
- `testdata/fixtures/features/src/` mit je einer kleinen Datei pro Fall aus
  `legacy/angular/src/app/helper/traverse*.ts` (z. B. `export default withRouter(Comp)`,
  `React.lazy(loadX)` mit Identifier, Re-Export eines Default-Imports, `PureComponent`,
  `React.PureComponent`, Getter/Setter, `connect()` mit/ohne Argument, TS-Typannotation als
  Komponentenabhängigkeit, `index.js`-Auflösung, absolute Imports über `/src/`, `useCallback` in
  Funktionskomponente, verschachtelte Funktionen, Funktion liefert `null`/JSX gemischt).
- Legacy-Capture für `features` (P02-Verfahren), G1/G2 erweitern.
- Zusätzlich gezielte Unit-Tests für `isReturningJSX`, `getAbsolutePath`, `getMaxJSXNesting`,
  `mergeAliasesWithOriginals`, `extractFileTree` mit kleinen ASTs.

## S04 – Analyse im Web Worker, Code-Splitting (M)
- `features/analysis/analysis.worker.ts` (`new Worker(new URL('./analysis.worker.ts', import.meta.url), { type: 'module' })`),
  Nachrichten `{ type: 'analyze', files }` → `{ type: 'progress', percent }` / `{ type: 'done', result }` /
  `{ type: 'error', message }`. `runAnalysis` nutzt den Worker, Fallback ohne Worker (Tests/jsdom).
- Kern nur im Worker laden → Haupt-Bundle deutlich kleiner (Spike: 1,72 MB gesamt). Ziel: Haupt-Chunk
  < 300 KB gzip. Ergebnis messen und notieren.
- **Abnahme:** UI bleibt während der Analyse von `realworld` bedienbar (Fortschrittsbalken animiert),
  Ergebnis identisch (G1 über Worker-Pfad im E2E-Test).

## S05 – Fehlerbehandlung (S)
- Kern: Option `onFileError?: (path, error) => 'skip' | 'throw'` (Standard `'throw'` = Altverhalten),
  Tests. Web: übersprungene Dateien als Snackbar-Liste („3 files could not be parsed: …“).
- `app/ErrorBoundary.tsx` um `GraphPage` mit Hinweis und Button „Back to upload“.
- ADR-011 A5 als umgesetzt markieren.

## S06 – Testlücken schließen (M)
- Ohne Zusatzwerkzeug (kein Coverage-Paket, Nutzerentscheidung): Liste aller Module in `core/src`
  (ohne `legacy/`) und `web/src/{state,lib,features}` gegen vorhandene Testdateien abgleichen; für
  jedes Modul ohne Test einen **Verhaltenstest** ergänzen; keine Tests, die nur Zeilen abdecken.
- Eigenprüfung (ab M7) zeigt zusätzlich Funktionen über den Schwellenwerten des Tools.
- Aufräumen (Nutzer, 08.11.2026): Quelltext-Eingaben in Kern-Tests stehen als Zeilenliste mit
  `[…].join('\n')` (z. B. `packages/core/src/analysis/analyzeProject.test.ts`). Lesbarer machen:
  Template-String mit kleinem Helfer, der den ersten Zeilenumbruch entfernt, oder Fixture-Dateien.

## S07 – Barrierefreiheit (M)
- Tastaturbedienung: Toolbar, Aktionsleiste, Dateibaum, Dialog, Select, Split-Trenner vollständig.
- Graph: Knoten fokussierbar (`tabIndex`, `role="button"`, `aria-label` „<Typ> <Name>, <Warnungen>“),
  Enter = Auswahl, Shift+Enter = Drill-down; sichtbarer Fokusrand.
- Kontrast prüfen (z. B. Zeilennummern `#e0e2e5` sind bewusst blass – Altoptik; dokumentieren, ggf.
  ADR mit dem Nutzer).
- `prefers-reduced-motion`: Übergänge und Layout-Animation verkürzen.

## S08 – Sicherheit und Lieferkette (S)
- `index.html`: Content-Security-Policy per `<meta http-equiv>`: `default-src 'self'; script-src 'self';
  style-src 'self' 'unsafe-inline'` (CodeMirror setzt Inline-Styles), `img-src 'self' data:`,
  `font-src 'self'`, `worker-src 'self'`, `connect-src 'self'`, `object-src 'none'`, `base-uri 'none'`.
  Prüfen, dass Dev und Build funktionieren.
- `pnpm audit --prod` dokumentieren; `THIRD_PARTY_LICENSES.md` erzeugen (Lizenzen aller
  Laufzeitpakete aus `pnpm licenses list --prod`), Hinweis MPL-2.0 (escomplex) und ISC/MIT.
- Prüfen, dass keine Netzwerkzugriffe zur Laufzeit erfolgen (offline nutzbar).

## S09 – Performance (M)
- `tools/golden/generate-large-fixture.mjs`: deterministisch (fester Seed), 300 Komponenten-Dateien in
  Ordnern, mit Importen und Klassen/Funktionen; nach `.cache/fixtures/large/` (nicht ins Repo).
- Messen: Analysezeit, Zeit bis Layout-Ende, Frame-Zeit beim Rendern (Performance-Panel), Speicher.
- Ziel: Frame ≤ 16 ms bei 300 Knoten; sonst Positionsupdates per Ref statt React-Render (Architektur §6),
  `React.memo` für `GraphNode`.
