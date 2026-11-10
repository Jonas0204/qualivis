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
  Der Monorepo-Weg (P05.5, `analyzeWorkspaceAsync` mit `ProjectFiles` und `appDir`) läuft ebenfalls
  im Worker, samt Auswahl und Umschreiben; Messwerte von `qualivis.info()` als Ausgangswert (RI14).
- Kern nur im Worker laden → Haupt-Bundle deutlich kleiner (Spike: 1,72 MB gesamt). Ziel: Haupt-Chunk
  < 300 KB gzip (Ausgangswert nach P04: ein Chunk, 1,31 MB, gzip 329,7 kB; Vite warnt ab 500 kB).
  Ergebnis messen und notieren.
- **Abnahme:** UI bleibt während der Analyse von `realworld` bedienbar (Fortschrittsbalken animiert),
  Ergebnis identisch (G1 über Worker-Pfad im E2E-Test).

## S05 – Fehlerbehandlung (S)
- Kern: Option `onFileError?: (path, error) => 'skip' | 'throw'` (Standard `'throw'` = Altverhalten),
  Tests. Web: übersprungene Dateien als Snackbar-Liste („3 files could not be parsed: …“).
  Schon vorhanden: `analyzeProject.ts` loggt einen Parsefehler mit dem Pfad der Datei und wirft
  ihn weiter; `onFileError` setzt an dieser Stelle an.
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
- Aufräumen (Nutzer, 09.11.2026): Bei unbekannter Komponenten-ID zeigt `selectViewGraph` den
  App-Graph als App-Ansicht (das Altsystem rechnete ihn als Komponentenansicht). Prüfen, ob der
  Fall nach dem Bereinigen der URL (`useUrlState`) noch eintreten kann; sonst vereinfachen.
- Aufräumen (Review P05, 10.11.2026): `GraphCanvas` hat 12 Props, `GraphNode` 7 (Konventionen §5:
  höchstens 6). Zusammengehörige Props zu Objekten bündeln, ohne das Verhalten zu ändern.

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
- Ziel: Frame ≤ 16 ms bei 300 Knoten.
- **Schon erledigt** (in P06 vorgezogen, Nutzer 10.11.2026):
  - `writePositions` schreibt die Positionen pro Frame direkt ins DOM; React rendert nur das erste
    Bild und das Ende.
  - `GraphNode` und `GraphLink` haben `React.memo`; Knoten und Kanten liegen in einer
    memoisierten Ebene, Zoomen und Verschieben rendern nur die Zoom-Gruppe.
  - Schriftgröße und Linienbreite beim Zoomen sind CSS-Variablen der Zoom-Gruppe.
  - Knopf „Stop layout“ und Zoom-Übergang per `requestAnimationFrame` (ADR-011 A24); gespeicherte
    Ansichten (A22).
  - Messung mit 400 Komponenten und 817 Kanten im Dev-Modus: Frame ohne WebCola 1,8 ms statt etwa
    70 ms, Zoomschritt 4–24 ms statt etwa 70 ms.
  - WebCola ersetzt (Branch `rewrite/replace-webcola`): Das Fluss-Layout ist jetzt d3-force mit
    eigenen Fluss-Regeln nach jedem Schritt (`flow.ts`). Testgraph mit 400 Komponenten und 1.530
    Kanten aus 32 Bereichen: Schritt 1,1 ms statt 69,5 ms, kein Start mehr (WebCola 3,1 s), Ruhe
    nach 300 Schritten (WebCola nach 860 noch nicht), keine Kante gegen den Fluss, keine
    Überlappung, Kreuzungen 98.500 statt 102.400.
  - Takt des Layouts (Nutzer, 10.11.2026): 240 Ticks pro Sekunde auf jedem Bildschirm, höchstens
    120 Bilder pro Sekunde, höchstens 6 ms Rechenzeit pro Bild. Das Layout ist nach etwa 1,25 s
    fertig; im Altsystem lief ein Tick pro Bild, also 5 s bei 60 Hz und 2,5 s bei 120 Hz.
  - `qualivis.info()` nennt keine Datei-, Pfad- oder Komponentennamen mehr, und
    `qualivis.info().export()` speichert das Ergebnis als JSON-Datei. Bei langen Frames zeigt es
    auch die Zeit für Style, Layout und Paint (`styleAndLayoutMs`).
- **Offen:**
  - d3-force noch schneller (gemessen 10.11.2026 in Node, 300 Schritte): Die Kollision braucht
    60 % der Schrittzeit, die Abstoßung 38 %, Kanten, Zentrieren und die Schleife zusammen unter
    2 %. Eine eigene Kollision mit Gitter statt Quadtree (etwa 35 Zeilen, gleiche Regel) war
    3,3-mal so schnell, der ganze Schritt 1,7-mal (700 Knoten: 2,3 statt 3,8 ms), bei gleichen
    Überlappungen. Die Abstoßung (Barnes-Hut) selbst zu schreiben lohnt nicht: etwa 100 Zeilen für
    etwa doppelte Geschwindigkeit. Angehen, wenn 700+ Knoten es brauchen.
  - Das Layout (`forceLayout.ts`) startet eine wiederhergestellte, noch laufende Ansicht mit
    alpha 1 neu statt mit dem alten Wert; seit dem Ersatz von WebCola gilt das auch für das
    Fluss-Layout.
