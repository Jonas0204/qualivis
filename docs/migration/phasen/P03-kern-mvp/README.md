# P03 – Kern-MVP `@qualivis/core` (Meilenstein M1, Teil 1)

**Ziel:** Das Paket `@qualivis/core` analysiert ein Projekt (Liste von `{ path, code }`) und liefert
dieselben Ergebnisse wie das Altsystem (Halstead-Fließkommawerte mit kleiner Toleranz). Golden G1 läuft in `pnpm check`.

| Schritt | Titel | Umfang |
|---|---|---|
| [S01](S01-paket-skelett.md) | Paket-Skelett, Modelltypen und Konstanten | M |
| [S02](S02-altcode-uebernehmen.md) | Analysehelfer 1:1 übernehmen (vorerst `@ts-nocheck`) | S |
| [S03](S03-escomplex-adapter.md) | escomplex-Adapter mit `path-browserify` | S |
| [S04](S04-analyze-project.md) | `analyzeProject` und `analyzeProjectAsync` | M |
| [S05](S05-golden-g1-und-api.md) | Golden-Test G1, öffentliche API, Paket-README | M |
| [S06](S06-altcode-typisieren.md) | Altcode typisieren (ohne Laufzeitänderung), G1 bleibt grün | M |

**Leitplanke:** In dieser Phase wird **keine** Analyse-Logik verändert. Erlaubt sind nur
Typannotationen, `!`, `as`-Casts, Importpfade und die dokumentierten Anpassungen
(`01-referenz-altsystem/02-analyse-kern.md` §3). G1 ist der Beweis. Die Typisierung (S06) kommt
bewusst **nach** G1, damit jede Änderung sofort gegen das Original geprüft wird.
