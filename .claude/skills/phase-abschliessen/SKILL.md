---
name: phase-abschliessen
description: Schließt eine Phase des Qualivis-Migrationsplans ab. Prüft den Phasen-Branch, schlägt vor, was aus der Doku entfernt wird, entwirft Titel und Beschreibung des Pull Requests nach rewrite/react und pusht bzw. legt den PR erst nach ausdrücklicher Nachfrage an. Nur verwenden, wenn der Nutzer das verlangt.
disable-model-invocation: true
---

# Phase abschließen

## 1. Voraussetzungen prüfen (nur lesen)

- Aktueller Branch ist der Phasen-Branch (`rewrite/pNN-…`), das Arbeitsverzeichnis ist sauber.
- Alle Schritte der Phase sind in `docs/migration/STATUS.md` ☑ (oder ⊘ mit Begründung),
  einschließlich des Abnahme-Schritts.
- Jeder Schritt hat einen Commit: `git log --oneline rewrite/react..HEAD`.
- `pnpm check` ist grün.

Fehlt etwas: melden und nicht weitermachen.

## 2. Doku aufräumen (Vorschlag, gelöscht wird erst nach Zustimmung)

Was umgesetzt ist, steht im Code und in der Git-Historie. Vorschlagen, aus der Doku zu entfernen:

- die Schritt-Karten und die README der Phase (`docs/migration/phasen/Pnn-*/`),
- ADRs, die mit dieser Phase vollständig umgesetzt sind und deren Regeln in Konfiguration oder
  Grundlagen stehen (IDs nicht neu vergeben),
- Vorlagen in `anhang/` und Code-Snippets in anderen Dokumenten, die nur diese Phase brauchte,
- erledigte Nutzerentscheidungen (O…) und Notizen in `STATUS.md`.

Für jede Stelle alle Verweise suchen (`git grep -n "<ID oder Pfad>" -- docs AGENTS.md .claude`)
und mit anpassen. Regeln, die weiter gelten, vorher nach `AGENTS.md`, `05-konventionen.md` oder
`06-teststrategie.md` übernehmen. In `STATUS.md` die Zeilen der Phase zu einer zusammenfassen, im
Plan-README die Phase als erledigt markieren.

## 3. Pull Request entwerfen

- Titel: `Pnn: <Phasentitel>` (Titel aus der Phasen-README).
- Beschreibung auf Englisch in `.cache/pr-body.md` (der Ordner ist ignoriert und wird nie
  committet). Gliederung:
  - `What is in it`: die Schritte mit je einem Satz
  - `Checks`: Befehle und Ergebnis, ggf. G1/G2
  - `Deviations from the plan`
  - `Docs removed`: was aus der Doku entfernt wurde
  - `Not done yet`
- Keine Hinweise auf Claude/KI, keine Session-Links, keine Klarnamen, keine lokalen Pfade.

## 4. Nachfragen, genau für diese Aktionen

Dem Nutzer die Löschliste aus Schritt 2, Titel, Beschreibung und die Befehle zeigen und seine
Zustimmung abwarten:

1. Löschliste umsetzen, `pnpm check`, Commit `docs(docs): remove implemented plan parts of Pnn`
   (Identität aus der lokalen `CLAUDE.md`)
2. `git push -u origin <phasen-branch>`
3. `gh pr create --base rewrite/react --head <phasen-branch> --title "<titel>" --body-file .cache/pr-body.md`

Erst nach einem klaren „ja“ ausführen. `gh` liegt unter Windows ggf. nicht im `PATH` (Pfad: lokale
`CLAUDE.md`). Ist `gh` nicht angemeldet: den Nutzer bitten, `gh auth login` selbst auszuführen.
Nie Tokens lesen, setzen oder ausgeben.

## 5. Danach

- Den PR-Link nennen. Gibt es eine CI: den aktuellen Stand der Checks einmal nennen
  (`gh pr checks <nummer>`), nicht abwarten oder wiederholt abfragen.
- Nie mergen, approven, schließen, Auto-Merge einschalten oder Branches löschen. Gemergt wird vom
  Nutzer per Merge-Commit.
- Den PR-Link trägt der erste Schritt der nächsten Phase in `STATUS.md` ein, damit auf dem
  PR-Branch kein Extra-Commit nötig ist.
