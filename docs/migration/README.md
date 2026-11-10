# Migrationsplan: Component Graph → Qualivis (React)

Dieser Ordner ist der vollständige, schrittweise Plan, um die Angular-9-App „Component Graph“
(Tarner, van den Bongard, Beck: *Visually Analyzing the Structure and Code Quality of
Component-based Web Applications*, VISSOFT 2021) als **Qualivis** auf React 19 mit
framework-freiem Analyse-Kern umzuschreiben (Windows und macOS, Node 24, pnpm 12, feste Versionen).
Er ist so geschrieben, dass **leichtere Modelle** ihn Schritt für Schritt umsetzen können: Jede
Schritt-Karte nennt Kontext, Dateien, konkrete Schritte, prüfbare Kriterien und Fallstricke.

Die riskantesten Annahmen wurden vorab in einem Wegwerf-Spike am echten Stack geprüft: Der
übernommene Kern liefert mit Babel 7.29 und escomplex 0.1 für zwei Testprojekte dieselben
Ergebnisse wie der alte Build (0 Abweichungen).

**Pflege:** Umgesetzte Schritt-Karten, ADRs und Vorlagen werden vor dem PR ihrer Phase entfernt
(nach Zustimmung, Skill `phase-abschliessen`). Sie bleiben in der Git-Historie. Am Ende bleiben die
Grundlagen und `STATUS.md`.

> **Einstieg für Agenten:** [`AGENTS.md`](../../AGENTS.md) im Repo-Root (Leseweg, Kurzregeln,
> Abkürzungen, Befehle). Abläufe liegen als Skills in `.claude/skills/`.

## Inhalt

| Ordner/Datei | Inhalt |
|---|---|
| [STATUS.md](STATUS.md) | Fortschritt aller Schritte und Meilensteine |
| **00-grundlagen/** | |
| [01-ziele-und-scope.md](00-grundlagen/01-ziele-und-scope.md) | Ziele, Nicht-Ziele, MVP-Meilensteine, Definition of Done |
| [02-qualitaetskriterien.md](00-grundlagen/02-qualitaetskriterien.md) | Kriterien aus der Bachelorarbeit (ISO/IEC 25010, Metriken, React-Smells) |
| [03-architektur.md](00-grundlagen/03-architektur.md) | Pakete, Ordner, Abhängigkeitsregeln, Datenfluss, State, Rendering |
| [04-technologie-stack.md](00-grundlagen/04-technologie-stack.md) | Werkzeuge, Pakete und ihr Zweck, Regeln für Abhängigkeiten, Patches |
| [05-konventionen.md](00-grundlagen/05-konventionen.md) | Code-Stil, TypeScript, React, CSS, Commits, Aufbau der Schritt-Karten |
| [06-teststrategie.md](00-grundlagen/06-teststrategie.md) | Testebenen, Golden-Konzept G1–G6 („God-Test“) |
| [07-entscheidungen.md](00-grundlagen/07-entscheidungen.md) | offene Architekturentscheidungen (ADRs) |
| [08-risiken-und-offene-punkte.md](00-grundlagen/08-risiken-und-offene-punkte.md) | Nutzerentscheidungen ohne ADR (O2, O5, O14, O16–O19), Risiken RI1–RI16 |
| **01-referenz-altsystem/** | |
| [01-funktionsinventar.md](01-referenz-altsystem/01-funktionsinventar.md) | Jedes sichtbare Verhalten des Altsystems (Abnahmegrundlage) |
| [02-analyse-kern.md](01-referenz-altsystem/02-analyse-kern.md) | Analyse-Pipeline, Dateien, Datenstrukturen, Eigenheiten K1–K12 |
| [03-visuelle-regeln.md](01-referenz-altsystem/03-visuelle-regeln.md) | Formeln und Regeln des Graphen, Eigenheiten V1–V7 |
| [04-stil-referenz.md](01-referenz-altsystem/04-stil-referenz.md) | Gemessene Farben, Schriften, Maße |
| **phasen/** | |
| P01, P02 | **erledigt** (M0): Repo-Umbau, Workspace, Golden-Infrastruktur; Karten entfernt |
| P03 | **erledigt** (M1, Teil 1): CI, `@qualivis/core` mit Golden G1; Karten entfernt |
| P04 | **erledigt** (M1, Teil 2): Web-MVP, GitHub Pages; Karten entfernt |
| P05 | **erledigt** (M2): Graph wie im Original; Karten entfernt |
| P05.5 | eingeschoben (ADR-019, ohne Meilenstein): **erledigt**; Karten entfernt |
| P06 | **erledigt** (M3): Panels, Auswahl, Drill-down, URL; Karten entfernt |
| [P07-einstellungen-persistenz](phasen/P07-einstellungen-persistenz/README.md) | Einstellungen, Persistenz, Hinweise (M4) |
| [P08-haertung](phasen/P08-haertung/README.md) | Typen, Worker, A11y, Sicherheit, Performance (M5) |
| [P09-e2e-paritaet](phasen/P09-e2e-paritaet/README.md) | Playwright, automatisierte Parität (M6) |
| [P10-core-paket-cli](phasen/P10-core-paket-cli/README.md) | Paket-Build (privat), CLI, Eigenprüfung (M7) |
| [P11-abschluss](phasen/P11-abschluss/README.md) | Doku, Babel 8 (M8) |

## So wird der Plan benutzt

1. **Einstieg:** [`AGENTS.md`](../../AGENTS.md) im Repo-Root: Leseweg, Kurzregeln, Abkürzungen,
   Befehle. Die Grundlagen (`00-grundlagen/`) werden nicht vorab gelesen, sondern nur, wenn die
   Karte oder die Tabelle in `AGENTS.md` darauf verweist.
2. **Pro Schritt:** Skill `schritt-umsetzen` (`.claude/skills/schritt-umsetzen/SKILL.md`; ohne
   Skill-Unterstützung die Datei lesen und befolgen): `STATUS.md` → nächster offener Schritt →
   Phasen-README → Schritt-Karte → nur die dort verlinkten Abschnitte und Altcode-Stellen. Erster
   Schritt einer Phase: zuerst den Phasen-Branch anlegen (Abschnitt „Branches und Pull Requests“).
3. **Umsetzen** direkt im Arbeitsverzeichnis, Akzeptanzkriterien abhaken, Prüfbefehle ausführen.
4. **Abschluss:** `STATUS.md` aktualisieren, dem Nutzer Ergebnis + Commit-Vorschlag melden. Die
   Änderungen bleiben **uncommittet**, bis der Nutzer sie in der IDE geprüft hat (R3). Phase
   fertig: Skill `phase-abschliessen`, nur auf Wunsch des Nutzers.

Reihenfolge ist bis M4 verbindlich. Ein Schritt beginnt erst, wenn seine Abhängigkeiten erledigt sind.

## Branches und Pull Requests

Der Nutzer arbeitet auch unterwegs und prüft dann auf GitHub. Deshalb gibt es pro Phase einen
Branch und einen Pull Request:

| Branch | Zweck |
|---|---|
| `master` | Altstand (Angular). Bleibt unberührt. |
| `rewrite/react` | Integrationszweig des Neubaus. Hier landen nur gemergte PRs. |
| `rewrite/pNN-<name>` | ein Branch pro Phase, `<name>` = Ordnername ohne Präfix (z. B. `rewrite/p01-fundament`, `rewrite/p04-web-mvp`) |
| `rewrite/docs-<thema>` | Planänderungen außerhalb einer Phase (z. B. `rewrite/docs-test-provider`) |
| `rewrite/mN-<name>` | nur wenn mehrere Phasen eines Meilensteins zusammen umgesetzt werden (z. B. `rewrite/m0-fundament` für P01 + P02) |

Ablauf:
1. **Phase beginnen** (Arbeitsverzeichnis sauber): `git switch rewrite/react`,
   `git pull --ff-only origin rewrite/react` (holt die gemergten PRs),
   `git switch -c rewrite/pNN-<name>`.
2. **Pro Schritt:** umsetzen, uncommittet zur Review melden. Auf Anweisung des Nutzers: ein Commit
   pro Schritt (Identität aus der lokalen `CLAUDE.md`). Pushen nur nach Nachfrage, z. B. damit der
   Nutzer den Zwischenstand unterwegs sieht.
3. **Phase fertig** (Meilenstein-Abnahme, falls die Phase eine hat): umgesetzte Teile der Doku
   entfernen (nach Zustimmung), dann nach Nachfrage pushen und einen PR mit Ziel `rewrite/react` anlegen. Titel `Pnn: <Phasentitel>`. Beschreibung: erledigte Schritte,
   Prüfergebnisse (`pnpm check`, ggf. G1/G2), Abweichungen, offene Punkte. **Keine** Hinweise auf
   Claude/KI. Gibt es eine CI, nennt der Assistent einmal den Stand der Checks. Den
   Link zum PR trägt der erste Schritt der nächsten Phase in `STATUS.md` (Tabelle „Phasen“) ein.
   Ablauf als Skill: `phase-abschliessen`.
4. **Review und Merge** macht der Nutzer auf GitHub, und zwar als **Merge-Commit**: Kein Squash,
   damit die Schritt-Commits sichtbar bleiben; kein Rebase. Änderungswünsche aus dem Review kommen
   als weitere Commits auf denselben Branch, nie per `--amend` oder Force-Push.
5. **Nächste Phase** erst nach dem Merge beginnen (Schritt 1). Muss eine Phase vorher beginnen,
   zweigt ihr Branch vom vorherigen Phasen-Branch ab; das wird im PR vermerkt.

Voraussetzung für PRs: Die GitHub CLI (`gh`) ist auf dem jeweiligen Rechner angemeldet. Die
Anmeldung macht **der Nutzer selbst** (`gh auth login`); der Assistent fasst keine Tokens an.

## Regeln für die Umsetzung (gelten immer)

- **R1 – Ein Schritt nach dem anderen.** Keine Vorgriffe auf spätere Schritte, keine „Vorbereitung für
  später“. Was nicht in der Karte steht, wird nicht gebaut.
- **R2 – Nutzerregeln haben Vorrang.** Die globale `CLAUDE.md` des Nutzers gilt (u. a. keine
  History-Umschreibung, nichts außerhalb des Projektordners, keine Änderungen an Claude-Konfiguration,
  keine Secrets, nichts löschen ohne Bestätigung). Ergänzend gilt die **lokale** `CLAUDE.md` im
  Repo-Root (nicht versioniert): Commit-Identität und Push nach Nachfrage. Das Repo ist
  **öffentlich**: keine personenbezogenen Daten in Dateien, Commits und PRs (RI13).
- **R3 – Review vor Commit, Commits nur auf Anweisung.** Änderungen werden direkt im
  Arbeitsverzeichnis gemacht und bleiben **uncommittet**, damit der Nutzer sie im Diff seiner IDE
  prüfen kann. Am Ende jedes Schritts `git status` und Diff zusammenfassen und eine Commit-Message
  vorschlagen (`05-konventionen.md` §8, **ohne** Co-Author-/KI-Hinweise). Committet wird erst auf
  Anweisung, mit der Identität aus der lokalen `CLAUDE.md`. Push und Pull Request nur nach
  ausdrücklicher Nachfrage („Branches und Pull Requests“); gemergt wird nur vom Nutzer.
- **R4 – Installationen nur nach Nachfrage.** Vor jedem `pnpm install`/`pnpm add` den exakten Befehl,
  die Pakete (mit Version) und den Zweck nennen und die Zustimmung abwarten; erst dann ausführen
  (oder der Nutzer führt ihn aus). Blockiert der Hook des Nutzers einen Befehl: melden, nie umgehen
  (kein anderes Werkzeug, kein Skript).
- **R5 – Kern unverändert.** Code in `packages/core/src/legacy/` bekommt keine Logikänderungen. Erlaubt:
  Importpfade, Typen, `!`, Casts, dokumentierte Anpassungen. Golden G1/G2 muss immer grün sein.
- **R6 – Goldens sind heilig.** Nie von Hand ändern, nie anpassen, um einen Test grün zu machen
  (`06-teststrategie.md` §3).
- **R7 – Keine neuen Abhängigkeiten** außerhalb des Catalogs ohne Zustimmung (Paket, Zweck, Version,
  Lizenz, Abhängigkeiten, Alternativen nennen). Keine `minimumReleaseAgeExclude`-Einträge.
- **R8 – Tests prüfen Verhalten** (`06-teststrategie.md` §1). Tests nicht abschwächen oder löschen.
- **R9 – Bei Zweifel stoppen und fragen.** Widerspricht die Karte dem Code oder einer Referenz, ist etwas
  unklar oder schlägt ein Prüfbefehl unerklärlich fehl: Arbeit anhalten, Befund melden, Frage stellen.
  Abweichungen vom Plan nur mit Zustimmung und mit Eintrag in `STATUS.md` (ggf. neue ADR).
- **R10 – Ehrlich berichten.** Was wurde getan, was ist offen, was ist fehlgeschlagen (mit Ausgabe).

## Vorlage: Arbeitsauftrag für ein ausführendes Modell

In Claude Code reicht `/schritt-umsetzen P07-S01` (ohne ID: nächster offener Schritt). GitHub Copilot
in VS Code wählt den Skill anhand seiner Beschreibung. Für andere Werkzeuge diesen Text verwenden:

```
Lies AGENTS.md im Repo-Root und setze dann Schritt <Pxx-Syy> (ohne Angabe: den nächsten offenen
Schritt) nach .claude/skills/schritt-umsetzen/SKILL.md um. Lies nur, was AGENTS.md und die Karte
nennen. Lass die Änderungen uncommittet, damit ich sie in der IDE prüfen kann, und schlag am Ende
eine Commit-Message vor. Installationen, Commits, Push und PR nur nach Rückfrage. Wenn etwas unklar
ist oder nicht zum Code passt: stoppe und frage.
```

## Ergebnis nach M4 (Ausblick)

```
Ordner ziehen → @qualivis/core (wie Altsystem) → React-Oberfläche mit gleichem Aussehen
Laufzeit-Abhängigkeiten: React (react, react-dom, scheduler), Jotai, d3-force (+3), WebCola (+d3 v1,
nicht gebündelt), CodeMirror 6 (≈ 15, ein Projekt), Babel 7.29, escomplex 0.1 (+Patches),
path-browserify, jLouvain, zwei Schriftpakete.
Kein Angular, kein Material, kein RxJS, kein zone.js, kein CDN.
```
