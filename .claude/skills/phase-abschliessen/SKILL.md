---
name: phase-abschliessen
description: Schließt eine Phase des Qualivis-Migrationsplans ab. Prüft den Phasen-Branch, lässt die Commits unabhängig reviewen, schlägt vor, was aus der Doku entfernt wird, entwirft Titel und Beschreibung des Pull Requests nach rewrite/react und pusht bzw. legt den PR erst nach ausdrücklicher Nachfrage an. Nur verwenden, wenn der Nutzer das verlangt.
disable-model-invocation: true
---

# Phase abschließen

## 1. Voraussetzungen prüfen (nur lesen)

- Aktueller Branch ist der Phasen-Branch (`rewrite/pNN-…`), das Arbeitsverzeichnis ist sauber.
- Alle Schritte der Phase sind in `docs/migration/STATUS.md` ☑ (oder ⊘ mit Begründung),
  einschließlich des Abnahme-Schritts. Ausnahme: ◐ für einen Schritt, dessen Karte die letzte
  Prüfung erst nach dem Merge vorsieht (z. B. die veröffentlichte Seite); die Zeile nennt genau
  diese offene Prüfung.
- Jeder Schritt hat einen Commit: `git fetch origin`, dann
  `git log --oneline origin/rewrite/react..HEAD` (der PR vergleicht mit dem Stand auf GitHub).
- `pnpm check` ist grün.

Fehlt etwas: melden und nicht weitermachen.

## 2. Unabhängiges Review

- **Subagent:** stärkstes Modell, nur lesen (Regeln: `AGENTS.md`, „Subagenten“). Auftrag:
  - den Diff `origin/rewrite/react..HEAD` gegen die Karten der Phase prüfen, die noch vorhanden sind,
  - ebenso gegen den Altcode und `05-konventionen.md` prüfen,
  - Befunde mit Datei, Zeile und Begründung melden.
- Jeden Befund selbst prüfen. Echte Fehler dem Nutzer melden und nach seiner Zustimmung beheben,
  in einem eigenen Commit vor dem Aufräumen.
- Ohne Subagenten: das Review selbst machen.

## 3. Doku aufräumen (Vorschlag, gelöscht wird erst nach Zustimmung)

Was umgesetzt ist, steht im Code und in der Git-Historie. Vorschlagen, aus der Doku zu entfernen:

- die Schritt-Karten und die README der Phase (`docs/migration/phasen/Pnn-*/`),
- ADRs, die mit dieser Phase vollständig umgesetzt sind und deren Regeln in Konfiguration oder
  Grundlagen stehen (IDs nicht neu vergeben),
- Vorlagen (Ordner `docs/migration/anhang/`, falls vorhanden) und Code-Snippets in anderen
  Dokumenten, die nur diese Phase brauchte,
- erledigte Nutzerentscheidungen (O…) und Notizen in `STATUS.md`.

Kandidaten finden:

- **Subagent:** mittleres Modell, nur lesen. Auftrag: alle Stellen in `docs/`, `AGENTS.md` und
  `.claude/skills/` finden, die diese Phase beschreiben oder voraussetzen. Gemeint sind Phasen- und
  Schritt-IDs, ADRs, Anhänge und Pfade. Für jede Stelle meldet er:
  - Datei und Zeile,
  - ob sie umgesetzt ist und wo das jetzt steht (Code, Konfiguration, Grundlagen),
  - ob ein späterer Schritt sie noch braucht.
- **Selbst prüfen:** jede Fundstelle nachlesen und die IDs der Phase zusätzlich per `git grep`
  suchen, denn der Subagent kann Stellen übersehen. Erst daraus wird die Löschliste.
- **Bearbeiten:** nach der Zustimmung des Nutzers durch den Hauptagenten, nicht durch den
  Subagenten. Danach den eigenen Diff gegenlesen (`git diff --stat`, dann `git diff`).

Für jede Stelle alle Verweise suchen (`git grep -n "<ID oder Pfad>" -- docs AGENTS.md .claude`)
und mit anpassen. Regeln, die weiter gelten, vorher nach `AGENTS.md`, `05-konventionen.md` oder
`06-teststrategie.md` übernehmen. In `STATUS.md` die Zeilen der Phase zu einer zusammenfassen, im
Plan-README die Phase als erledigt markieren.

## 4. Pull Request entwerfen

- Titel: `Pnn: <Phasentitel>` (Titel aus der Phasen-README).
- Beschreibung auf Englisch in `.cache/pr-body.md` (der Ordner ist ignoriert und wird nie
  committet). Gliederung:
  - `What is in it`: die Schritte mit je einem Satz
  - `Checks`: Befehle und Ergebnis, ggf. G1/G2
  - `Deviations from the plan`
  - `Docs removed`: was aus der Doku entfernt wurde
  - `Not done yet`
- Keine Hinweise auf Claude/KI, keine Session-Links, keine Klarnamen, keine lokalen Pfade.

## 5. Nachfragen, genau für diese Aktionen

Dem Nutzer die Löschliste aus Schritt 3, Titel, Beschreibung und die Befehle zeigen und seine
Zustimmung abwarten:

1. Löschliste umsetzen, `pnpm check`, Commit `docs(docs): remove implemented plan parts of Pnn`
   (Identität aus der lokalen `CLAUDE.md`)
2. `git push -u origin <phasen-branch>`
3. `gh pr create --base rewrite/react --head <phasen-branch> --title "<titel>" --body-file .cache/pr-body.md`

Erst nach einem klaren „ja“ ausführen. `gh` liegt unter Windows ggf. nicht im `PATH` (Pfad: lokale
`CLAUDE.md`). Ist `gh` nicht angemeldet: den Nutzer bitten, `gh auth login` selbst auszuführen.
Nie Tokens lesen, setzen oder ausgeben.

## 6. Danach

- Den PR-Link nennen. Gibt es eine CI: den aktuellen Stand der Checks einmal nennen
  (`gh pr checks <nummer>`), nicht abwarten oder wiederholt abfragen.
- Nie mergen, approven, schließen, Auto-Merge einschalten oder Branches löschen. Gemergt wird vom
  Nutzer per Merge-Commit.
- Den PR-Link trägt der erste Schritt der nächsten Phase in `STATUS.md` ein, damit auf dem
  PR-Branch kein Extra-Commit nötig ist.
