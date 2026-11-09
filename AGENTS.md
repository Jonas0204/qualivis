# AGENTS.md – Einstieg für KI-Agenten

Diese Datei ist der **einzige Pflicht-Einstieg** für Agenten (Claude Code, GitHub Copilot, Codex
u. a.). Sie sagt, was du lesen musst und was nicht. Alles Weitere erreichst du über Verweise.

## Projekt in drei Sätzen

Qualivis ist der React-Neubau der Angular-App „Component Graph“; das Original liegt unverändert in
`legacy/angular/`. Gearbeitet wird nur nach dem Migrationsplan in `docs/migration/`: Phasen P01–P11
mit nummerierten Schritt-Karten. Analyse-Ergebnisse und Aussehen müssen gleich bleiben; der Beweis
sind Golden-Daten aus dem alten Build.

## Leseweg pro Aufgabe (sonst nichts)

1. Diese Datei.
2. `docs/migration/README.md`, nur Abschnitt „Regeln für die Umsetzung“ (R1–R10).
3. `docs/migration/STATUS.md`, Tabelle „Schritte“: der Schritt, den der Nutzer nennt, sonst die erste
   Zeile mit ☐.
4. Phasen-README `docs/migration/phasen/Pnn-*/README.md` und die Schritt-Karte `Syy-*.md`.
5. Nur die Abschnitte, auf die die Karte unter „Kontext“ verweist (Abkürzungen: Tabelle unten).
   Große Dateien nicht ganz lesen: Überschriften suchen (`grep -n '^#' <datei>`), dann nur den
   Abschnitt lesen.
6. Zusätzlich nur, wenn der Schritt es braucht:

| Wenn der Schritt … | dann lesen |
|---|---|
| Code in `packages/` oder `apps/` schreibt | `docs/migration/00-grundlagen/05-konventionen.md` §1–§7 |
| Tests schreibt | `docs/migration/00-grundlagen/06-teststrategie.md` §1–§2 |
| Goldens oder Parität berührt | `06-teststrategie.md` §3, `testdata/golden/README.md` |
| Ordner, Pakete oder Importe zwischen Paketen anlegt | `00-grundlagen/03-architektur.md` §2–§3 |
| Zustand (Jotai) anfasst | `03-architektur.md` §5, `anhang/A7-test-provider.md` |

Richtwert: Die Punkte 1–5 sind zusammen etwa 3.000–5.000 Wörter. Mehr zu lesen kostet Kontext und
Genauigkeit.

**Nicht lesen:** `pnpm-lock.yaml`, `legacy/angular/yarn.lock`, `legacy/angular/**` außer den Zeilen,
die die Karte nennt.
`testdata/golden/**` sind große JSON-Dateien: nie ganz lesen, gezielt suchen oder mit
`tools/golden/diff-json.mjs` vergleichen.

## Harte Regeln (Kurzfassung; maßgeblich sind README R1–R10)

- Änderungen direkt im Arbeitsverzeichnis machen und **uncommittet** lassen. Am Ende melden:
  Ergebnis, Prüfausgabe, `git status` in Kurzform, Commit-Vorschlag aus der Karte.
- **Kein** Commit, Push oder Pull Request ohne Anweisung bzw. Nachfrage beim Nutzer. Nie mergen,
  nie Force-Push, keine History-Umschreibung, keine Änderung an Git-Config oder Remotes.
- **Keine** Installation (`pnpm install`/`pnpm add`) ohne Nachfrage: Befehl, Pakete mit Version
  und Zweck nennen, Zustimmung abwarten.
- `packages/core/src/legacy/`: keine Logikänderung (R5). `testdata/golden/**`: nie von Hand ändern
  (R6). Tests nie abschwächen, um grün zu werden (R8).
- Ein Schritt nach dem anderen, nichts auf Vorrat (R1). Bei Widerspruch, Unklarheit oder
  unerklärlichem Fehler: stoppen, Befund melden, fragen (R9).
- **Das Repository ist öffentlich.** Keine personenbezogenen Daten (Klarnamen, private
  E-Mail-Adressen, lokale Pfade mit Benutzernamen), keine Secrets, keine Hinweise auf KI, keine
  Session-Links in Dateien, Commits oder PRs.
- Commit-Identität, Push- und PR-Regeln: lokale `CLAUDE.md` im Repo-Root (nicht versioniert).
  Fehlt sie: vor jedem Commit fragen.
- Das Repo beschreibt nur, was für alle gilt. Rechner- oder sitzungsspezifisches (lokale Pfade,
  installierte Versionen, Abweichungen auf einem Rechner, Arbeit per Fernzugriff) gehört in die
  lokale `CLAUDE.md`.
- Workflow-Dateien (`.github/workflows/`) nur ändern, wenn die Karte es verlangt, und erst nach
  Nachfrage.
- Fertig ist ein Schritt nach der Definition of Done (`00-grundlagen/01-ziele-und-scope.md` §5):
  Akzeptanzkriterien erfüllt, `pnpm check` grün, `STATUS.md` aktualisiert.

## Abkürzungen in den Karten → Datei

Alle Plan-Dateien liegen unter `docs/migration/`.

| In der Karte | Datei |
|---|---|
| Funktionsinventar, IDs `U`, `N`, `G`, `F`, `Q`, `S`, `P` + Zahl | `01-referenz-altsystem/01-funktionsinventar.md` |
| Analyse-Kern §n, Eigenheiten K1–K11 | `01-referenz-altsystem/02-analyse-kern.md` |
| `§n` ohne Dateiname (P05, P07-S03), Eigenheiten V1–V7 | `01-referenz-altsystem/03-visuelle-regeln.md` |
| Stil-Referenz §n | `01-referenz-altsystem/04-stil-referenz.md` |
| Architektur §n, Konventionen §n, Teststrategie §n | `00-grundlagen/03-architektur.md`, `05-konventionen.md`, `06-teststrategie.md` |
| G1–G6 (Golden-Stufen) | `00-grundlagen/06-teststrategie.md` §3 |
| M0–M8 (Meilensteine) | `00-grundlagen/01-ziele-und-scope.md` §4 |
| ADR-nnn, ADR-011 A1–A10 (Korrekturen) | `00-grundlagen/07-entscheidungen.md` |
| O2, O5, O14 (Nutzerentscheidungen ohne ADR), RI1–RI13 (Risiken) | `00-grundlagen/08-risiken-und-offene-punkte.md` |
| R1–R10 (Regeln) | `README.md`, Abschnitt „Regeln für die Umsetzung“ |
| A7 (Vorlage) | `anhang/` |
| Goldens `legacy-*.json` | `testdata/golden/<fixture>/` (Fixtures `mini`, `realworld`) |

**Altcode-Pfade** (nach „Altcode“ oder „Altsystem“, meist unter „Kontext“) sind in den Karten
gekürzt. Die Zeilenangaben gelten unverändert, denn die Dateien wurden nur verschoben (Stand Commit
`a071f27`). Pfade unter „Dateien“ sind dagegen neue Dateien im jeweiligen Paket.

- `app.component.*` → direkt in `legacy/angular/src/app/`
- `xyz.component.ts|html|scss` → `legacy/angular/src/app/components/xyz/`
- `xyz.service.ts` → `legacy/angular/src/app/services/`
- `helper/…`, `components/…`, `directives/…`, `constants/…`, `services/…`, `interfaces.ts`,
  `types.ts` → unter `legacy/angular/src/app/`
- `src/index.html`, `src/styles.scss`, `src/assets/…` → unter `legacy/angular/`

## Befehle

| Befehl | Zweck |
|---|---|
| `pnpm check` | Lint (Biome), Typprüfung, alle Tests; vor jeder Übergabe grün |
| `pnpm format` | formatieren und automatisch behebbare Lint-Fehler beheben |
| `pnpm test:parity` | nur die Golden-Tests des Kerns |
| `pnpm dev`, `pnpm build` | App starten bzw. bauen (ab P04) |
| `pnpm legacy:extract`, `pnpm legacy:serve` | alten Build entpacken und lokal starten, nur für Golden-Erfassung (`tools/legacy/README.md`) |
| `node tools/golden/diff-json.mjs <erwartet.json> <ist.json> [n]` | zeigt die ersten n (Standard 60) Pfade, an denen zwei JSON-Dateien abweichen; Exit 0 gleich, 1 verschieden, 2 Aufruffehler |

## Wo liegt was

| Pfad | Inhalt |
|---|---|
| `docs/migration/` | Plan, `STATUS.md`, Entscheidungen (ADRs) |
| `packages/core/` | Analyse-Kern `@qualivis/core` |
| `apps/web/` | React-App (ab P04) |
| `tools/` | Hilfsprogramme mit Tests: Node-Versionsprüfung, Legacy-Server, Capture-Skript, JSON-Diff |
| `testdata/fixtures/`, `testdata/golden/` | Testprojekte und Referenzdaten aus dem alten Build |
| `legacy/angular/` | Altsystem, nur lesen |
| `.claude/skills/` | Abläufe als Skills (Claude Code und GitHub Copilot in VS Code lesen diesen Ordner) |

## Skills

- `schritt-umsetzen`: den nächsten oder einen genannten Schritt umsetzen.
- `phase-abschliessen`: Phase prüfen und reviewen lassen, Doku aufräumen, Pull Request vorbereiten,
  nach Nachfrage pushen und anlegen.
  Nur auf ausdrücklichen Wunsch des Nutzers.

Ohne Skill-Unterstützung die jeweilige `.claude/skills/<name>/SKILL.md` lesen und befolgen.

## Subagenten

Gilt für Werkzeuge, die Subagenten starten können (z. B. Claude Code). Grundsatz: Der Hauptagent
arbeitet selbst, Subagenten gibt es nur für die drei Fälle in der Tabelle.

- **Immer selbst:**
  - Code schreiben, mit dem stärksten verfügbaren Modell (bei Claude: Opus).
  - Den Kontext eines Schritts lesen. Eine Zusammenfassung verliert die genauen Zeilen, auf die es
    beim 1:1-Verhalten ankommt.
  - Tests und `pnpm check` ausführen, bei Bedarf im Hintergrund.

| Fall | Modell | Auftrag |
|---|---|---|
| Unabhängiges Review am Phasenende oder nach einem großen Schritt | stärkstes (Opus) | Diff gegen Karten, Altcode und Konventionen prüfen und Befunde melden |
| Breite Suche über viele Dateien (Altcode, Doku) | mittleres (Sonnet) | Fundstellen mit Datei und Zeile liefern; lesen tut sie dann der Hauptagent |
| Recherche nebenbei (Versionen, Changelogs, SHAs von Actions) | mittleres (Sonnet) | Ergebnis mit Quelle |

- Für Suchen nie das kleinste Modell nehmen: Eine übersehene Stelle kostet mehr als die gesparten
  Tokens.
- Subagenten nur lesen lassen. Im Auftrag ausdrücklich verbieten: Dateien ändern oder löschen,
  installieren, committen, pushen.
- Vorher dem Nutzer in einem Satz sagen, was der Subagent tut und mit welchem Modell.
- Ergebnisse sind Hinweise, kein Beweis. Jeden Befund selbst prüfen, bevor er an den Nutzer geht.

## Pflege der Doku

- Regeln ändern: README R1–R10 und die Kurzfassung oben gemeinsam anpassen.
- Neue Kurzverweise in Karten nur, wenn sie in der Abkürzungstabelle stehen.
- Umgesetztes (Karten, ADRs, Vorlagen, Code-Snippets) wird vor dem PR der Phase entfernt, nach
  Zustimmung des Nutzers (Skill `phase-abschliessen`). Es bleibt in der Git-Historie; IDs werden
  nicht neu vergeben. Am Ende bleiben die Grundlagen und `STATUS.md`.
