# P02-S01 – Legacy-Build extrahieren und lokal ausliefern

Meilenstein M0 · Abhängig von: P01-S04 · Umfang S

## Ziel
`pnpm legacy:extract` legt den alten Produktions-Build nach `.cache/legacy-build/`;
`pnpm legacy:serve` liefert ihn unter `http://127.0.0.1:4300/component-graph/` aus, zusammen mit
den Fixtures und einem Capture-Endpunkt.

## Kontext
`anhang/A1-legacy-server.md` (vollständiger, erprobter Code beider Skripte).

## Dateien
`tools/legacy/extract-legacy-build.mjs`, `tools/legacy/serve-legacy.mjs`,
`tools/legacy/README.md`, `tools/legacy/serve-legacy.test.mjs`.

## Schritte
1. Beide Skripte aus A1 1:1 übernehmen.
2. `tools/legacy/README.md`: Zweck, Befehle, Hinweis „nur lokal, enthält verwundbare Bibliotheken,
   nie öffentlich ausliefern“, Endpunkte des Servers.
3. Test `tools/legacy/serve-legacy.test.mjs` (Verhalten des Servers, ohne Legacy-Build):
   - Server als Kindprozess auf freiem Port starten (`node tools/legacy/serve-legacy.mjs 4399`),
     auf Ausgabe „legacy server on“ warten.
   - `GET /fixtures/<name>/manifest.json` liefert sortierte Liste (Test legt dafür ein temporäres
     Fixture unter `testdata/fixtures/__test__/` an **und löscht es danach wieder**; alternativ
     Server um optionale Umgebungsvariable `QV_FIXTURES_DIR` erweitern und auf ein Temp-Verzeichnis
     zeigen lassen – bevorzugt, weil nichts im Repo angelegt wird).
   - `GET /fixtures/x/../../package.json` → 500 (Pfad-Ausbruch verhindert).
   - `POST /capture/<name>/a.json` schreibt die Datei (ebenfalls über `QV_CAPTURE_DIR` in ein
     Temp-Verzeichnis).
   - Prozess im `afterAll` beenden.
   Dafür in `serve-legacy.mjs` die drei Verzeichnisse über Umgebungsvariablen überschreibbar machen:
   `QV_LEGACY_BUILD_DIR`, `QV_FIXTURES_DIR`, `QV_CAPTURE_DIR` (Standard wie in A1).
4. Prüfen, ob `origin/gh-pages` lokal existiert: `git rev-parse --verify origin/gh-pages`. Falls
   nicht: Nutzer bitten, `git fetch origin gh-pages` auszuführen (Netzwerkzugriff → Nutzer).
5. `pnpm legacy:extract`; danach `.cache/legacy-build/index.html` vorhanden.
6. `pnpm legacy:serve` im Hintergrund starten; im Browser `http://127.0.0.1:4300/component-graph/`
   öffnen → Upload-Karte „Drag and drop or browse a folder“ ist sichtbar. Server beenden.

## Akzeptanzkriterien
- [ ] `pnpm legacy:extract` erzeugt `.cache/legacy-build/` mit `index.html` und `main-es2015.*.js`.
- [ ] Altsystem startet im Browser, Upload-Karte sichtbar.
- [ ] Servertests grün (`pnpm test`), inkl. Pfad-Ausbruchs-Test.
- [ ] `.cache/` ist in `.gitignore` (nicht im Commit).

## Prüfen
`pnpm legacy:extract`, `pnpm test`, `git status` (kein `.cache/`)

## Fallstricke
- `tar` ist auf macOS und ab Windows 10 vorhanden. Fehlt es, Nutzer informieren.
- Port 4300 belegt → Port als Argument (`pnpm legacy:serve 4301`).
- Den Server immer an `127.0.0.1` binden, nie `0.0.0.0`.

## Nicht tun
- Den Legacy-Build nicht ins Repo committen (nur `.cache/`).

## Commit-Vorschlag
`feat(tools): add legacy build extraction and local server`
