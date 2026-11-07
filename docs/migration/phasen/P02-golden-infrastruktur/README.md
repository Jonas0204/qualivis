# P02 – Golden-Infrastruktur (Meilenstein M0) – erledigt

Umgesetzt am 08.11.2026 zusammen mit P01 (Branch `rewrite/m0-fundament`). Die Schritt-Karten
S01–S03 und die Anhänge A1–A3 wurden danach entfernt, weil Code und Daten jetzt im Repo liegen.
Ältere Fassungen liegen in der Git-Historie (Commit `e771129`).

## Ergebnis

| Was | Wo |
|---|---|
| Legacy-Build entpacken (`pnpm legacy:extract`) und lokal ausliefern (`pnpm legacy:serve`), mit Tests (Pfad-Ausbruch, Manifest, Capture, SPA-Fallback) | `tools/legacy/` (`README.md`) |
| Capture-Skript für den Browser | `tools/legacy/capture.browser.js` |
| JSON-Diff mit Tests | `tools/golden/diff-json.mjs` |
| Fixtures `mini` (8 Dateien) und `realworld` (38 Dateien, MIT, Commit `ee72eba`), bytegenau | `testdata/fixtures/` (`testdata/README.md`) |
| Goldens: `mini` 13 Dateien (4 KVs), `realworld` 45 Dateien (20 KVs) | `testdata/golden/` (`README.md`) |

**Prüfungen:** Alle Plausibilitätswerte aus `01-referenz-altsystem/05-golden-daten.md` §3 stimmen.
Die `mini`-Goldens sind byteidentisch mit der Spike-Erfassung vom 07.11.2026. Bei `realworld` sind
Report, FileMap und App-Graph identisch mit der früheren Erfassung, die der neue Kern im Spike mit
0 Abweichungen reproduziert hat.

## Abweichungen vom ursprünglichen Plan

- **`tar` mit relativen Pfaden:** `extract-legacy-build.mjs` ruft `tar` mit relativen Pfaden auf.
  Das GNU-`tar` aus Git Bash liest `D:\…` sonst als `host:pfad` („Cannot connect to D:“). So
  funktioniert es mit GNU-`tar` (Git Bash), bsdtar (Windows, macOS) und Linux.
