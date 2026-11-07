# P02-S03 – Goldens erfassen, dokumentieren, Diff-Werkzeug

Meilenstein M0 · Abhängig von: P02-S01, P02-S02 · Umfang M

## Ziel
Für `mini` und `realworld` liegen alle Referenzdateien des Altsystems in `testdata/golden/`,
dokumentiert und plausibilisiert. Ein Diff-Werkzeug zeigt Abweichungen pfadgenau.

## Kontext
- `anhang/A2-capture-skript.md` (Skript + Ablauf, verifiziert)
- `anhang/A5-golden-test-und-diff.md` (`diff-json.mjs`)
- `01-referenz-altsystem/05-golden-daten.md` (Ablage, Plausibilitätswerte)

## Dateien
`tools/legacy/capture.browser.js`, `tools/golden/diff-json.mjs`, `tools/golden/diff-json.test.mjs`,
`testdata/golden/README.md`, `testdata/golden/{mini,realworld}/*.json`.

## Schritte
1. `tools/legacy/capture.browser.js` aus A2 übernehmen (Inhalt = `window.qvCapture = …`).
2. `tools/golden/diff-json.mjs` aus A5 übernehmen.
3. Test `tools/golden/diff-json.test.mjs`: zwei temporäre JSON-Dateien → Exit-Code 0 bei Gleichheit,
   1 bei Unterschied, Ausgabe enthält den abweichenden Pfad (z. B. `$.a.b: 1 -> 2`). Aufruf per
   `child_process.execFileSync(process.execPath, [...])`.
4. Erfassung `mini` (Browser mit JavaScript-Konsole; im Claude-Desktop über das Browser-Fenster und
   JavaScript-Ausführung):
   1. `pnpm legacy:serve` im Hintergrund.
   2. `http://127.0.0.1:4300/component-graph/` öffnen.
   3. Konsole: `window.onbeforeunload = null; localStorage.clear(); location.href = '/component-graph/';`
   4. Nach dem Neuladen: Inhalt von `capture.browser.js` einfügen, dann `await qvCapture('mini')`.
      Erwartete Rückgabe: `{ fixture: 'mini', files: 8, componentViews: 4 }`.
5. Dasselbe für `realworld` (Schritt 4.3 erneut ausführen, dann `await qvCapture('realworld')`).
6. Plausibilitätswerte aus `05-golden-daten.md` §3 prüfen (z. B. per kleinem Node-Einzeiler oder
   im Editor). Bei Abweichung: **stoppen**, Nutzer informieren, nichts committen.
7. `testdata/golden/README.md`: Herkunft (Legacy-Commit `a071f27`, gh-pages-Commit `5f0155e`),
   Datum, Browser und Fenstergröße, Einstellungen (Standard), Liste der Dateien je Fixture,
   Verfahren (Verweis A2), Regel „nie von Hand ändern“.
8. Server beenden.

## Akzeptanzkriterien
- [ ] `testdata/golden/mini/` enthält: `legacy-report.json`, `legacy-filemap.json`,
      `legacy-appgraph.json`, `legacy-dom-app.json`, `legacy-panels-app.json` und je 4 Dateien
      `legacy-dom-component-*.json` / `legacy-panels-component-*.json`.
- [ ] `testdata/golden/realworld/` analog (Anzahl KVs = Komponenten mit Funktionen; Rückgabewert
      `componentViews` notieren).
- [ ] Alle Plausibilitätswerte stimmen.
- [ ] `diff-json`-Test grün; `pnpm check` grün.

## Prüfen
`pnpm check`; `node tools/golden/diff-json.mjs testdata/golden/mini/legacy-report.json testdata/golden/mini/legacy-report.json` → `total differences: 0`.

## Fallstricke
- Vor jedem Capture den Ausgangszustand herstellen (Schritt 4.3), sonst vermischen sich Fixtures.
- Läuft der Capture in ein Timeout: Fenster nicht minimieren (Hintergrund-Tabs drosseln Timer).
- Die Snackbar „Tip: …“ erscheint während der Erfassung; das ist normal.

## Nicht tun
- JSON-Dateien nicht formatieren oder umsortieren (Biome ignoriert `testdata/`, Editor-Autoformat
  aus).

## Commit-Vorschlag
`test(testdata): capture golden reference data from legacy build`
