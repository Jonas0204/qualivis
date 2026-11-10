# Status der Umsetzung

Legende: ☐ offen · ◐ in Arbeit · ☑ erledigt · ⊘ übersprungen (mit Begründung)
Pflege: Nach jedem Schritt Zeile aktualisieren (Datum, Kurznotiz). Meilensteine mit Datum der
Bestätigung durch den Nutzer. Vor dem PR einer Phase werden ihre Zeilen zu einer zusammengefasst
(Skill `phase-abschliessen`).

| Meilenstein | Status | Bestätigt am |
|---|---|---|
| M0 Fundament | ☑ (08.11.2026) | 08.11.2026 (Merge von PR #1) |
| M1 Erstes Produkt | ☑ (09.11.2026) | 09.11.2026 (Nutzer, Sichtvergleich mit dem Altsystem) |
| M2 Graph-Parität | ☑ (09.11.2026) | 09.11.2026 (Nutzer, Sichtvergleich mit dem Altsystem) |
| M3 Analyse-UI | ☑ (10.11.2026) | 10.11.2026 (Nutzer, Abnahme im Browser) |
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
| P05 Graph-Parität | `rewrite/p05-graph-paritaet` | [#3](https://github.com/Jonas0204/qualivis/pull/3) | ☑ |
| P05.5 Monorepo-Unterstützung (eingeschoben, ADR-019) | `rewrite/p05.5-monorepo` | mit P06 ([#4](https://github.com/Jonas0204/qualivis/pull/4)) | ☑ |
| P06 Panels, Navigation | `rewrite/p06-panels-navigation` | [#4](https://github.com/Jonas0204/qualivis/pull/4) | ☑ |
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
| P05 | M2: Graph-Parität | ☑ | 10.11.2026 | Commits `2b24c84`–`7cdd942` (dazu `2867e6e`, Plan P05.5), danach `31d8777` (Review-Korrektur), Aufräumen und ein Fix für `.venv` beim Upload. `pnpm test:parity` prüft G1–G3 (Kern und Web). Bewusste Abweichungen: ADR-011 A12–A18. Offen: Das Golden der Clusterfarben belegt nur 7 der 20 Farben (visuelle Regeln §4) |
| P05.5, P06 | Monorepo-Unterstützung (S01–S08); M3: Panels, Navigation | ☑ | 10.11.2026 | Commits `d0065bc`–`25ccc11`, PR #4, ein PR für beide Phasen; S08 (Abnahme am echten Monorepo) vom Nutzer bestätigt (P06 zweigte von P05.5 ab, weil P05.5 für eine Präsentation aufgeschoben wurde). `pnpm test:parity` prüft G1–G4. Teile von P08-S09 vorgezogen (P08-README). Bewusste Abweichungen: ADR-011 A19–A24 |
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

Zurzeit keine.
