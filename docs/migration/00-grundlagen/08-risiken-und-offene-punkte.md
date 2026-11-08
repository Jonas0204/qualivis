# Risiken und Entscheidungen des Nutzers

## 1. Entscheidungen des Nutzers (ab 07.11.2026)

| ID | Frage | Entscheidung | Folgen im Plan |
|---|---|---|---|
| O1 | Name der App | **Qualivis**; „Component Graph“ nur dort, wo es fachlich passt (Graph-Ansicht) | ADR-012, ADR-011 A10 |
| O2 | Lizenz / Veröffentlichung | **keine Lizenz**, keine npm-Veröffentlichung. Das Repo selbst ist öffentlich (GitHub-Fork, O14) | alle Pakete `"private": true`; Veröffentlichungs-Schritt in P10 entfällt; keine personenbezogenen Daten im Repo (RI13) |
| O3 | Deployment | 07.11.: vorerst keins. **Geändert 08.11.2026:** ab M1 die **neue** App nach jedem Merge in `rewrite/react` auf GitHub Pages; die alte Seite wird nicht mehr ausgeliefert, der Branch `gh-pages` bleibt | ADR-016, P04-S07 |
| O4 | CI | 07.11.: vorerst keine. **Geändert 08.11.2026:** CI für PRs als eigene Karte (Ubuntu, Windows, macOS); Dependabot vorerst nicht | ADR-016, P03-S00; `pnpm quality:self` kommt in P10-S03 dazu |
| O5 | `legacy/angular/` | **bleibt im Repo** | Altsystem-Schritt in P11 entfällt |
| O6 | UI-Eigenheiten V1 (keine Icons, wenn Größen nicht nach Metrik) und Q5 (keine Icons bei Auswahl über den Dateibaum) | **korrigieren** | ADR-011 A8, A9 |
| O7 | Zustandsverwaltung | **Jotai** 3.0.1 | ADR-013 |
| O8 | Pfad-Modul für escomplex | **`path-browserify`** in Node und Browser (statt kopiertem Code) | ADR-005 |
| O9 | Versionen | **fest gepinnt**, `minimumReleaseAge` **3 Tage** | ADR-014 |
| O10 | Plattformen | **Windows und macOS**, Node **24** | `04-technologie-stack.md`, alle Befehle plattformneutral |
| O11 | Ohne jsdom testen (Jotai-`TestProvider`)? | **jsdom + Testing Library bleiben**, dazu `TestProvider` (Provider + `useHydrateAtoms`) | ADR-015, `06-teststrategie.md` §2, `anhang/A7`, P04-S02 |
| O12 | Review- und Merge-Ablauf | Änderungen bleiben **uncommittet** im Arbeitsverzeichnis, bis der Nutzer sie in der IDE geprüft hat. Danach Commit, Push und PR auf seine Anweisung bzw. nach Nachfrage. **Ein Branch und ein PR pro Phase** mit Ziel `rewrite/react`; gemergt wird vom Nutzer | `README.md` (R3, „Branches und Pull Requests“), `05-konventionen.md` §8 |
| O13 | Einstieg für Agenten (Claude Code, Copilot u. a.), ohne alles zu lesen | **`AGENTS.md`** im Root als einzige Einstiegsdatei, dazu die Skills `schritt-umsetzen` und `phase-abschliessen` in `.claude/skills/`; die lokale `CLAUDE.md` importiert `@AGENTS.md` | ADR-017 |
| O14 | Repo privat machen? | **offen.** Das Repo ist ein Fork und lässt sich so nicht privat stellen. Möglich: Settings → Danger Zone → „Leave fork network“, danach als eigenständiges Repo privat stellen (Issues, PRs und Kommentare gehen dabei verloren, die Commits bleiben). Folgen von privat: begrenzte Actions-Minuten (Windows und macOS zählen mehrfach), Pages nur mit Bezahl-Abo und trotzdem öffentlich | bis zur Entscheidung: als öffentlich behandeln (RI13) |

Neue offene Fragen werden hier mit nächster freier ID ergänzt.

## 2. Risiken

| ID | Risiko | Wahrscheinlichkeit | Auswirkung | Gegenmaßnahme |
|---|---|---|---|---|
| RI1 | Babel 7 läuft im Juni 2027 aus | sicher | mittel | P11-S02 rechtzeitig angehen; Goldens zeigen jede Abweichung |
| RI2 | Ausnutzbare Sicherheitsmeldung in escomplex/WebCola/jLouvain oder deren Abhängigkeiten | gering | mittel | `pnpm audit --prod` je Phase; dann Neubewertung (neue ADR) |
| RI3 | Feste Versionen + Mindestalter verzögern Sicherheitsupdates | mittel | gering | Version gezielt anheben (≥ 3 Tage alt), Nutzer fragen; später Renovate |
| RI4 | React-Rendering pro Tick zu langsam bei großen Graphen | mittel | mittel | P08-S09 misst; Fallback: Positionen per Ref |
| RI5 | Material-Optik ohne Material-Bibliothek weicht sichtbar ab | mittel | gering | Stil-Referenz mit Messwerten, Sichtvergleich G5 |
| RI6 | jsdom-Grenzen (Layout, CodeMirror) verleiten zu schwachen Tests | mittel | mittel | Messfunktionen injizieren; E2E für Echtes (`06-teststrategie.md` §4) |
| RI7 | Leichtere Modelle „verbessern“ Altcode und brechen G1 | mittel | hoch | Regel R5 im README; G1 in `pnpm check` |
| RI8 | TypeScript 7 / Werkzeuge haben Kinderkrankheiten | gering | mittel | im Spike verifiziert; bei Problemen TS 6.0 als Rückfall (ADR) |
| RI9 | `localStorage`-Limit (≈ 5 MB) bei großen Projekten | mittel | gering | `try/catch`, Meldung; später IndexedDB (eigene ADR) |
| RI10 | Installationen ohne Rückfrage | gering | mittel | Installationen nur nach Nachfrage mit Befehl, Paketen und Zweck (README R4); Hook des Nutzers prüft zusätzlich |
| RI11 | Unterschiede Windows/macOS (Pfade, Dateiüberwachung, Browser-Kanal) | mittel | gering | `path-browserify`, `.gitattributes eol=lf`, plattformneutrale Befehle, `tar` mit relativen Pfaden (M0); P04-S01 prüft `pnpm dev` auf dem Mac |
| RI12 | Jotai 3 ist neu (09/2026); Beispiele im Netz meist v2 | mittel | gering | nur Grund-API nutzen (`atom`, `useAtom*`, `atomWithStorage`, `createStore`, `Provider`); Doku der installierten Version |
| RI13 | Öffentliches Repo: personenbezogene Daten oder Secrets gelangen in Dateien, Commits oder PRs | mittel | hoch | Regel in `AGENTS.md` und README R2; Commits mit noreply-Adresse; vor jedem Commit den Diff auf Klarnamen, private E-Mail-Adressen und lokale Pfade mit Benutzernamen prüfen. Was einmal gepusht ist, bleibt in der Historie (keine History-Umschreibung) |
