# Status der Umsetzung

Legende: ☐ offen · ◐ in Arbeit · ☑ erledigt · ⊘ übersprungen (mit Begründung)
Pflege: Nach jedem Schritt Zeile aktualisieren (Datum, Kurznotiz, Abweichungen). Meilensteine mit
Datum der Bestätigung durch den Nutzer.

| Meilenstein | Status | Bestätigt am |
|---|---|---|
| M0 Fundament | ☑ (08.11.2026) | mit dem Merge des PR |
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
| Plan | `rewrite/react` (direkt, vor Einführung der PRs) | – | ☑ |
| P01 Fundament + P02 Golden-Infrastruktur | `rewrite/m0-fundament` (beide zusammen) | (Link nach dem Anlegen) | ☑ |
| P03 Kern-MVP | `rewrite/p03-kern-mvp` | | ☐ |
| P04 Web-MVP | `rewrite/p04-web-mvp` | | ☐ |
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
| P01-S01 | Arbeitsstand sichern, Branch | ☑ | 07.11.2026 | Branch `rewrite/react`, Plan committet, lokale `CLAUDE.md` angelegt |
| P01-S02 | Angular nach `legacy/angular/` | ☑ | 08.11.2026 | `git mv`; `.editorconfig` und alte `.gitignore` zusätzlich 1:1 kopiert; Karte entfernt |
| P01-S03 | Workspace-Grundgerüst | ☑ | 08.11.2026 | `patchedDependencies` bis P03-S01 auskommentiert; Biome ohne `*.md`; Karte entfernt |
| P01-S04 | Installation, Checks grün | ☑ | 08.11.2026 | `pnpm install` (41 Pakete), `pnpm check` grün (3 Testdateien, 12 Tests); Karte entfernt |
| P02-S01 | Legacy-Build lokal | ☑ | 08.11.2026 | `tar` mit relativen Pfaden (GNU-tar unter Git Bash); Server-Tests mit `QV_*`; Karte entfernt |
| P02-S02 | Fixtures `mini`, `realworld` | ☑ | 08.11.2026 | `mini` = A3 (8/8 identisch), `realworld` = Commit `ee72eba` (38/38 identisch); Karte entfernt |
| P02-S03 | Goldens erfassen, Diff-Werkzeug | ☑ | 08.11.2026 | `mini` 13 Dateien (byteidentisch zum Spike), `realworld` 45 Dateien; Plausibilitätswerte stimmen; Karte entfernt |
| P03-S01 | Kern: Skelett, Modell | ☐ | | |
| P03-S02 | Kern: Altcode 1:1 | ☐ | | |
| P03-S03 | Kern: escomplex-Adapter | ☐ | | |
| P03-S04 | Kern: `analyzeProject` | ☐ | | |
| P03-S05 | Kern: Golden G1, API | ☐ | | |
| P03-S06 | Kern: Altcode typisieren | ☐ | | |
| P04-S01 | Web: Skelett, Tokens, Schriften | ☐ | | |
| P04-S02 | Web: Jotai-Atome | ☐ | | |
| P04-S03 | Web: Upload, App-Rahmen | ☐ | | |
| P04-S04 | Web: Analyse-Fluss | ☐ | | |
| P04-S05 | Web: Minimaler Graph | ☐ | | |
| P04-S06 | M1-Abnahme | ☐ | | |
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

## Aufgelöste Versionen

| Paket | Version | Seit Schritt |
|---|---|---|
| Node.js | 24.22.2 (lokal, Windows) | M0 |
| pnpm | 12.16.1 | M0 |
| `@biomejs/biome` | 2.6.4 | M0 |
| `typescript` | 7.0.2 | M0 |
| `vitest` | 5.0.5 | M0 |
| `@types/node` | 24.19.2 | M0 |

## Abweichungen und Notizen

(Hier jede Abweichung vom Plan mit Begründung und Verweis auf ADR bzw. Nutzerentscheidung eintragen.)

- 07.11.2026 – Planrevision nach Review: Halstead-Toleranz, Qualitätskriterien gekürzt, Features dürfen
  Features nutzen (ohne Zyklen), Jotai (ADR-013), `type` statt `interface`, feste Versionen und
  3 Tage Mindestalter (ADR-014), Node 24 + macOS, `path-browserify` (ADR-005), O1–O10 entschieden,
  Korrekturen A8–A10.
- 07.11.2026 – Zweite Revision: jsdom bleibt, dazu Jotai-`TestProvider` (ADR-015, `anhang/A7`,
  Prüfung in P04-S02); Review in der IDE vor jedem Commit, Branch + PR pro Phase nach `rewrite/react`
  (O11, O12).
- 08.11.2026 – M0 (P01 + P02) auf Wunsch des Nutzers in einem Zug umgesetzt, ein Commit, PR nach
  `rewrite/react`. Die umgesetzten Schritt-Karten (P01-S01–S04, P02-S01–S03) und die Anhänge A1–A3 sind
  entfernt (Inhalt steht jetzt in `tools/`, `testdata/` und den Konfigurationsdateien). Abweichungen:
  siehe `phasen/P01-fundament/README.md` und `phasen/P02-golden-infrastruktur/README.md`.
  Installationen darf der Assistent seit heute nach Nachfrage selbst ausführen (README R4).
