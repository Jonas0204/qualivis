# P02 – Golden-Infrastruktur (Meilenstein M0)

**Ziel:** Das Altsystem lässt sich lokal ohne alte Abhängigkeiten starten, zwei Testprojekte liegen
in `testdata/fixtures/`, und für beide sind die Referenzdaten (Goldens) aus dem alten Build in
`testdata/golden/` gespeichert. Damit kann jede spätere Phase gegen das Original geprüft werden.

| Schritt | Titel | Umfang |
|---|---|---|
| [S01](S01-legacy-build-lokal.md) | Legacy-Build extrahieren und lokal ausliefern | S |
| [S02](S02-fixtures.md) | Testprojekte `mini` und `realworld` anlegen | S |
| [S03](S03-goldens-erfassen.md) | Goldens erfassen, dokumentieren, Diff-Werkzeug | M |

**Definition of Done der Phase:** `testdata/golden/{mini,realworld}/` enthalten alle Dateien aus
`01-referenz-altsystem/05-golden-daten.md` §1; die Plausibilitätswerte (§3) stimmen; der Nutzer hat
committet. Voraussetzung im Repo: Branch `gh-pages` ist lokal als `origin/gh-pages` vorhanden.
