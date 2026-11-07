# P02-S02 – Testprojekte `mini` und `realworld` anlegen

Meilenstein M0 · Abhängig von: P01-S02 (`.gitattributes`) · Umfang S

## Ziel
Zwei Testprojekte liegen byte-genau in `testdata/fixtures/`: das eigene `mini` (alle wichtigen
Erkennungsfälle) und `realworld` (echtes React-Projekt aus dem Paper).

## Kontext
- `anhang/A3-fixture-mini.md` (Inhalt `mini`, verbatim)
- `00-grundlagen/06-teststrategie.md` §6
- Quelle `realworld`: https://github.com/gothinkster/react-redux-realworld-example-app,
  Commit `ee72eba4056392c95a27bc48d385d3f54ba38a18` (2021-09-07), Lizenz MIT (GoThinkster).

## Dateien
`testdata/README.md`, `testdata/fixtures/mini/src/**` (8 Dateien),
`testdata/fixtures/realworld/src/**` (38 Dateien), `testdata/fixtures/realworld.LICENSE.md`,
`testdata/fixtures/realworld.SOURCE.md`.

## Schritte
1. `mini`: die acht Dateien aus A3 exakt anlegen (LF, abschließender Zeilenumbruch wie gezeigt).
2. `realworld` – **vorher den Nutzer um Zustimmung zum Download bitten** (Quelle, Commit, Größe
   ≈ 470 KB, nur Quelltext, nichts wird installiert oder ausgeführt). Nach Zustimmung:
   1. In ein Verzeichnis **außerhalb** des Repos klonen (z. B. Scratchpad/Temp):
      `git clone https://github.com/gothinkster/react-redux-realworld-example-app.git realworld-src`
      und `git -C realworld-src checkout ee72eba4056392c95a27bc48d385d3f54ba38a18`.
   2. Nur `src/` nach `testdata/fixtures/realworld/src/` kopieren (38 Dateien).
   3. `LICENSE.md` nach `testdata/fixtures/realworld.LICENSE.md` kopieren.
      **Nicht** in den Fixture-Ordner selbst legen (jede Datei dort wird Teil der Eingabe).
   4. `testdata/fixtures/realworld.SOURCE.md`: URL, Commit, Datum, Lizenz, „nur `src/` übernommen,
      unverändert“.
3. `testdata/README.md`: Zweck von `fixtures/` und `golden/`, Beschreibung beider Fixtures (Fälle
   aus A3), Regel „Fixture-Ordner enthalten nur Analyse-Eingabe“, Regel „Goldens nie von Hand
   ändern“ (Verweis `06-teststrategie.md` §3).
4. Prüfen, dass Git die Dateien unverändert speichert: `git add --dry-run testdata` und
   `git check-attr -a testdata/fixtures/mini/src/App.js` (muss `text: unset` zeigen).

## Akzeptanzkriterien
- [ ] `testdata/fixtures/mini/src/` enthält genau 8 Dateien, `realworld/src/` genau 38.
- [ ] Keine weiteren Dateien in `testdata/fixtures/mini/` bzw. `testdata/fixtures/realworld/`.
- [ ] Lizenz und Quelle von `realworld` dokumentiert.
- [ ] `pnpm check` weiterhin grün (Biome/TS/Vitest ignorieren `testdata/`).

## Prüfen
`pnpm check`; Dateizählung z. B. `git ls-files testdata/fixtures/mini | wc -l` nach Staging.

## Fallstricke
- `utils.test.js` in `mini` darf **nicht** von Vitest eingesammelt werden. Die Vitest-Projekte
  nutzen explizite `include`-Muster unter `src/`/`test/` der Pakete; prüfen, dass `pnpm test`
  sie nicht anfasst.
- Editor-Autoformat beim Anlegen ausschalten (Zeilennummern zählen).

## Nicht tun
- Im `realworld`-Klon nichts installieren oder ausführen. Den Klon nicht ins Repo legen.

## Commit-Vorschlag
`test(testdata): add mini and realworld fixtures`
