# Status der Umsetzung

Legende: ☐ offen · ◐ in Arbeit · ☑ erledigt · ⊘ übersprungen (mit Begründung)
Pflege: Nach jedem Schritt Zeile aktualisieren (Datum, Kurznotiz). Meilensteine mit Datum der
Bestätigung durch den Nutzer. Vor dem PR einer Phase werden ihre Zeilen zu einer zusammengefasst
(Skill `phase-abschliessen`).

| Meilenstein | Status | Bestätigt am |
|---|---|---|
| M0 Fundament | ☑ (08.11.2026) | 08.11.2026 (Merge von PR #1) |
| M1 Erstes Produkt | ☐ | |
| M2 Graph-Parität | ☐ | |
| M3 Analyse-UI | ☐ | |
| M4 Funktionsparität | ☐ | |
| M5 Härtung | ☐ | |
| M6 Parität E2E | ☐ | |
| M7 Kern als Paket + CLI | ☐ | |
| M8 Abschluss | ☐ | |

## Phasen (Branch und Pull Request)

Ablauf: README, „Branches und Pull Requests“. Ziel aller PRs: `rewrite/react`.

| Phase | Branch | PR | Status |
|---|---|---|---|
| P01 Fundament + P02 Golden-Infrastruktur | `rewrite/m0-fundament` | [#1](https://github.com/Jonas0204/qualivis/pull/1) | ☑ |
| P03 Kern-MVP | `rewrite/p03-kern-mvp` | | ☑ |
| P04 Web-MVP | `rewrite/p04-web-mvp` | | ◐ |
| P05 Graph-Parität | `rewrite/p05-graph-paritaet` | | ☐ |
| P06 Panels, Navigation | `rewrite/p06-panels-navigation` | | ☐ |
| P07 Einstellungen, Persistenz | `rewrite/p07-einstellungen-persistenz` | | ☐ |
| P08 Härtung | `rewrite/p08-haertung` | | ☐ |
| P09 E2E-Parität | `rewrite/p09-e2e-paritaet` | | ☐ |
| P10 Kern-Paket, CLI | `rewrite/p10-core-paket-cli` | | ☐ |
| P11 Abschluss | `rewrite/p11-abschluss` | | ☐ |

## Schritte

| Schritt | Titel | Status | Datum | Notiz |
|---|---|---|---|---|
| P01, P02 | M0: Fundament, Golden-Infrastruktur | ☑ | 08.11.2026 | Commit `5647a06`, PR #1 |
| P03 | M1 (Teil 1): CI, Kern `@qualivis/core`, Golden G1 | ☑ | 08.11.2026 | Commits `5e54b41`–`1bd11f9` |
| P04-S01 | Web: Skelett, Tokens, Schriften | ☑ | 09.11.2026 | `apps/web` mit Vite 8, 32 Tokens, lokalen Schriften, `Icon`; CI baut mit. macOS prüft der Nutzer noch |
| P04-S02 | Web: Jotai-Atome | ☑ | 09.11.2026 | Atome Analyse/Ansicht, `StateProvider`, Testhilfen. A7 erstmals ausgeführt: `new Map(…)` lehnt `tsc` ab (Jotai 3, TS 7), daher die Ausweichlösung aus A7 (Nutzer, 09.11.2026) |
| P04-S03 | Web: Upload, App-Rahmen | ☑ | 09.11.2026 | Auswahl und Drop liefern `SourceFile[]` (A7: `readEntries` bis leer), Upload-Karte, Toolbar, `AppShell`; Sichtvergleich mit dem Altsystem gleich bis auf Titel und Zahnrad (P07) |
| P04-S04 | Web: Analyse-Fluss | ☑ | 09.11.2026 | `runAnalysis` mit Fortschritt und Fehlerzeile (A5), `ProgressBar`; `realworld` im Browser analysiert (38 Dateien, Balken, Wechsel zur Graph-Ansicht) |
| P04-S05 | Web: Minimaler Graph | ☑ | 09.11.2026 | `viewGraphAtom`, Kraft-Layout (§9.3, Ziehen nach §11), `GraphCanvas`, viewBox um die Knoten; `realworld` in der Seite: 32 Kreise, 36 Pfeile, alles im Bild. Die laufende Animation prüft der Nutzer in S06 (im versteckten Browserfenster pausiert `requestAnimationFrame`) |
| P04-S06 | M1-Abnahme | ☐ | | |
| P04-S07 | GitHub Pages (neue App) | ☐ | | |
| P05-S01 | Regeln: Größe, Icons | ☐ | | |
| P05-S02 | Regeln: Geometrie, Farben | ☐ | | |
| P05-S03 | Regeln: Cluster, Constraints | ☐ | | |
| P05-S04 | Golden G2 | ☐ | | |
| P05-S05 | Knoten-/Kanten-Rendering | ☐ | | |
| P05-S06 | WebCola-Adapter | ☐ | | |
| P05-S07 | Zoom & Pan | ☐ | | |
| P05-S08 | Knoten ziehen | ☐ | | |
| P05-S09 | Auswahl, Ausblenden | ☐ | | |
| P05-S10 | Label-Kollision | ☐ | | |
| P05-S11 | Legende, Aktionsleiste | ☐ | | |
| P05-S12 | M2-Abnahme | ☐ | | |
| P06-S01 | Split-Layout | ☐ | | |
| P06-S02 | Auswahlmodell | ☐ | | |
| P06-S03 | Dateibaum | ☐ | | |
| P06-S04 | Code-Quality-Panel, G4 | ☐ | | |
| P06-S05 | Quelltext (CodeMirror 6) | ☐ | | |
| P06-S06 | Drill-down, URL | ☐ | | |
| P06-S07 | M3-Abnahme | ☐ | | |
| P07-S01 | Settings-Atom | ☐ | | |
| P07-S02 | Einstellungsdialog | ☐ | | |
| P07-S03 | Wirkung der Einstellungen | ☐ | | |
| P07-S04 | Snackbar, Hinweise | ☐ | | |
| P07-S05 | Analyse-Persistenz, Drop | ☐ | | |
| P07-S06 | M4-Abnahme | ☐ | | |
| P08-S00…S09 | Härtung (vor Beginn verfeinern) | ☐ | | |
| P09-S00…S05 | E2E & Parität (vor Beginn verfeinern) | ☐ | | |
| P10-S00…S03 | Kern-Paket & CLI (vor Beginn verfeinern) | ☐ | | |
| P11-S00…S02 | Abschluss (vor Beginn verfeinern) | ☐ | | |

## Abweichungen und Notizen

Hier jede Abweichung vom Plan mit Begründung und Verweis (ADR bzw. Nutzerentscheidung) eintragen,
solange sie für kommende Schritte wichtig ist. Vor dem PR der Phase wandert sie in die betroffenen
Karten oder Grundlagen oder wird gestrichen; Erledigtes steht in der Git-Historie.

- Kanten, deren Quell- oder Zielknoten fehlt, werden mit dem Konsolenfehler des Altsystems
  weggelassen. Das Altsystem behielt sie, und d3 brach dann mit „node not found“ ab. Gilt auch für
  das Auflösen der Kanten in P05-S04 (`buildViewModel`). In `mini` und `realworld` kommt das nicht
  vor. (Nutzer, 09.11.2026)
