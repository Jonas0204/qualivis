# Migrationsplan: Component Graph → Qualivis (React)

Dieser Ordner ist der vollständige, schrittweise Plan, um die Angular-9-App „Component Graph“
(Tarner, van den Bongard, Beck: *Visually Analyzing the Structure and Code Quality of
Component-based Web Applications*, VISSOFT 2021) als **Qualivis** auf React 19 mit
framework-freiem Analyse-Kern umzuschreiben (Windows und macOS, Node 24, pnpm 12, feste Versionen).
Er ist so geschrieben, dass **leichtere Modelle** ihn Schritt für Schritt umsetzen können: Jede
Schritt-Karte nennt Kontext, Dateien, konkrete Schritte, prüfbare Kriterien und Fallstricke.

Stand: 07.11.2026. Die riskantesten Annahmen wurden vorab in einem Wegwerf-Spike am echten Stack
geprüft (`anhang/A6-spike-protokoll.md`): Der übernommene Kern liefert mit Babel 7.29 und
escomplex 0.1 für zwei Testprojekte dieselben Ergebnisse wie der alte Build (0 Abweichungen).

## Inhalt

| Ordner/Datei | Inhalt |
|---|---|
| [STATUS.md](STATUS.md) | Fortschritt aller Schritte und Meilensteine |
| **00-grundlagen/** | |
| [01-ziele-und-scope.md](00-grundlagen/01-ziele-und-scope.md) | Ziele, Nicht-Ziele, MVP-Meilensteine, Definition of Done |
| [02-qualitaetskriterien.md](00-grundlagen/02-qualitaetskriterien.md) | Kriterien aus der Bachelorarbeit (ISO/IEC 25010, Metriken, React-Smells) |
| [03-architektur.md](00-grundlagen/03-architektur.md) | Pakete, Ordner, Abhängigkeitsregeln, Datenfluss, State, Rendering |
| [04-technologie-stack.md](00-grundlagen/04-technologie-stack.md) | Versionen, `pnpm-workspace.yaml`, Patches, Befehle |
| [05-konventionen.md](00-grundlagen/05-konventionen.md) | Code-Stil, TypeScript, React, CSS, Commits, Aufbau der Schritt-Karten |
| [06-teststrategie.md](00-grundlagen/06-teststrategie.md) | Testebenen, Golden-Konzept G1–G6 („God-Test“) |
| [07-entscheidungen.md](00-grundlagen/07-entscheidungen.md) | ADR-001 bis ADR-015 |
| [08-risiken-und-offene-punkte.md](00-grundlagen/08-risiken-und-offene-punkte.md) | Offene Nutzerentscheidungen, Risiken |
| **01-referenz-altsystem/** | |
| [01-funktionsinventar.md](01-referenz-altsystem/01-funktionsinventar.md) | Jedes sichtbare Verhalten des Altsystems (Abnahmegrundlage) |
| [02-analyse-kern.md](01-referenz-altsystem/02-analyse-kern.md) | Analyse-Pipeline, Dateien, Datenstrukturen, Eigenheiten K1–K11 |
| [03-visuelle-regeln.md](01-referenz-altsystem/03-visuelle-regeln.md) | Formeln und Regeln des Graphen, Eigenheiten V1–V7 |
| [04-stil-referenz.md](01-referenz-altsystem/04-stil-referenz.md) | Gemessene Farben, Schriften, Maße |
| [05-golden-daten.md](01-referenz-altsystem/05-golden-daten.md) | Referenzdaten: Ablage, Erfassung, Plausibilitätswerte |
| **phasen/** | |
| [P01-fundament](phasen/P01-fundament/README.md) | **erledigt:** Repo-Umbau, Workspace, Tooling (M0) |
| [P02-golden-infrastruktur](phasen/P02-golden-infrastruktur/README.md) | **erledigt:** Altsystem lokal, Fixtures, Goldens (M0) |
| [P03-kern-mvp](phasen/P03-kern-mvp/README.md) | `@qualivis/core` mit Golden G1 (M1) |
| [P04-web-mvp](phasen/P04-web-mvp/README.md) | Erstes sichtbares Produkt (M1) |
| [P05-graph-paritaet](phasen/P05-graph-paritaet/README.md) | Graph wie im Original (M2) |
| [P06-panels-navigation](phasen/P06-panels-navigation/README.md) | Panels, Auswahl, Drill-down (M3) |
| [P07-einstellungen-persistenz](phasen/P07-einstellungen-persistenz/README.md) | Einstellungen, Persistenz, Hinweise (M4) |
| [P08-haertung](phasen/P08-haertung/README.md) | Typen, Worker, A11y, Sicherheit, Performance (M5) |
| [P09-e2e-paritaet](phasen/P09-e2e-paritaet/README.md) | Playwright, automatisierte Parität (M6) |
| [P10-core-paket-cli](phasen/P10-core-paket-cli/README.md) | Paket-Build (privat), CLI, Eigenprüfung (M7) |
| [P11-abschluss](phasen/P11-abschluss/README.md) | Doku, Babel 8 (M8) |
| **anhang/** | |
| A1–A3 | entfernt: Legacy-Server, Capture-Skript und Fixture `mini` liegen seit M0 in `tools/legacy/` und `testdata/` |
| [A4-posix-path-und-interop.md](anhang/A4-posix-path-und-interop.md) | POSIX-Pfad, CJS-Interop, escomplex-Adapter (erprobt) |
| [A5-golden-test-und-diff.md](anhang/A5-golden-test-und-diff.md) | Golden-Test G1 mit Toleranz (erprobt); Diff-Werkzeug liegt in `tools/golden/` |
| [A6-spike-protokoll.md](anhang/A6-spike-protokoll.md) | Was vorab verifiziert wurde, Ergebnisse, Fallstricke |
| [A7-test-provider.md](anhang/A7-test-provider.md) | Jotai-Testhilfen `TestProvider`, `initial`, `renderWithState` (Vorlage, Prüfung in P04-S02) |

## So wird der Plan benutzt

1. **Einmalig lesen:** dieses README, dann `00-grundlagen/01`, `03`, `05`, `06`.
2. **Pro Schritt:** `STATUS.md` → nächsten offenen Schritt wählen → Phasen-README → Schritt-Karte →
   nur die dort verlinkten Referenzabschnitte und Altcode-Stellen lesen. Erster Schritt einer Phase:
   zuerst den Phasen-Branch anlegen (Abschnitt „Branches und Pull Requests“).
3. **Umsetzen** direkt im Arbeitsverzeichnis, Akzeptanzkriterien abhaken, Prüfbefehle ausführen.
4. **Abschluss:** `STATUS.md` aktualisieren, dem Nutzer Ergebnis + Commit-Vorschlag melden. Die
   Änderungen bleiben **uncommittet**, bis der Nutzer sie in der IDE geprüft hat (R3).

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
3. **Phase fertig** (Meilenstein-Abnahme, falls die Phase eine hat): nach Nachfrage pushen und einen
   PR mit Ziel `rewrite/react` anlegen. Titel `Pnn: <Phasentitel>`. Beschreibung: erledigte Schritte,
   Prüfergebnisse (`pnpm check`, ggf. G1/G2), Abweichungen, offene Punkte. **Keine** Hinweise auf
   Claude/KI. Den Link zum PR in `STATUS.md` (Tabelle „Phasen“) eintragen.
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
  Repo-Root (nicht versioniert): Commit-Identität und Push nach Nachfrage.
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

```
Du setzt den Migrationsplan in docs/migration/ um. Lies zuerst docs/migration/README.md
(insbesondere die Regeln R1–R10) sowie 00-grundlagen/03-architektur.md, 05-konventionen.md und
06-teststrategie.md. Bearbeite dann ausschließlich den Schritt <Pxx-Syy> gemäß der Datei
docs/migration/phasen/<Phase>/<Syy-…>.md. Lies nur die dort verlinkten Referenzen.
Ist es der erste Schritt einer Phase, lege zuerst den Phasen-Branch an (README, „Branches und Pull
Requests“). Halte dich an die Akzeptanzkriterien, führe die Prüfbefehle aus, aktualisiere STATUS.md und
lass die Änderungen uncommittet, damit ich sie in der IDE prüfen kann. Schlage am Ende eine
Commit-Message vor (committen nur auf meine Anweisung, gemäß lokaler CLAUDE.md; pushen und PRs nur
nach Nachfrage). Wenn du eine Installation brauchst, nenne mir Befehl, Pakete und Zweck und
warte auf meine Zustimmung. Wenn etwas unklar ist oder
nicht zum Code passt: stoppe und frage.
```

## Ergebnis nach M4 (Ausblick)

```
Ordner ziehen → @qualivis/core (wie Altsystem) → React-Oberfläche mit gleichem Aussehen
Laufzeit-Abhängigkeiten: React (react, react-dom, scheduler), Jotai, d3-force (+3), WebCola (+d3 v1,
nicht gebündelt), CodeMirror 6 (≈ 15, ein Projekt), Babel 7.29, escomplex 0.1 (+Patches),
path-browserify, jLouvain, zwei Schriftpakete.
Kein Angular, kein Material, kein RxJS, kein zone.js, kein CDN.
```
