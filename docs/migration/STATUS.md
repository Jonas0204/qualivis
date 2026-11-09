# Status der Umsetzung

Legende: ☐ offen · ◐ in Arbeit · ☑ erledigt · ⊘ übersprungen (mit Begründung)
Pflege: Nach jedem Schritt Zeile aktualisieren (Datum, Kurznotiz). Meilensteine mit Datum der
Bestätigung durch den Nutzer. Vor dem PR einer Phase werden ihre Zeilen zu einer zusammengefasst
(Skill `phase-abschliessen`).

| Meilenstein | Status | Bestätigt am |
|---|---|---|
| M0 Fundament | ☑ (08.11.2026) | 08.11.2026 (Merge von PR #1) |
| M1 Erstes Produkt | ☑ (09.11.2026) | 09.11.2026 (Nutzer, Sichtvergleich mit dem Altsystem) |
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
| P04 Web-MVP | `rewrite/p04-web-mvp` | [#2](https://github.com/Jonas0204/qualivis/pull/2) | ☑ |
| P05 Graph-Parität | `rewrite/p05-graph-paritaet` | | ◐ |
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
| P04 | M1 (Teil 2): Web-MVP, GitHub Pages | ☑ | 09.11.2026 | Commits `5ac8732`–`317cc37`, PR #2. Nach dem Merge: Pages-Workflow grün, Seite vom Nutzer geprüft, `origin/gh-pages` unverändert `5f0155e`. `pnpm dev` auf macOS bleibt offen (RI11) |
| P05-S01 | Regeln: Größe, Icons | ☑ | 09.11.2026 | `resolveThreshold`, `getNodeIcons`, `describeIconText`, `computeNodeVisual` in `packages/core/src/rules/`, 34 Tests; neue Korrektur ADR-011 A11 (feste Größe statt `NaN`) |
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
