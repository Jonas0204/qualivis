---
name: phase-abschliessen
description: Schließt eine Phase des Qualivis-Migrationsplans ab. Prüft den Phasen-Branch, entwirft Titel und Beschreibung des Pull Requests nach rewrite/react und pusht bzw. legt den PR erst nach ausdrücklicher Nachfrage an. Nur verwenden, wenn der Nutzer das verlangt.
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

## 2. Pull Request entwerfen

- Titel: `Pnn: <Phasentitel>` (Titel aus der Phasen-README).
- Beschreibung auf Englisch in `.cache/pr-body.md` (der Ordner ist ignoriert und wird nie
  committet). Gliederung:
  - `What is in it`: die Schritte mit je einem Satz
  - `Checks`: Befehle und Ergebnis, ggf. G1/G2
  - `Deviations from the plan`
  - `Not done yet`
- Keine Hinweise auf Claude/KI, keine Session-Links, keine Klarnamen, keine lokalen Pfade.

## 3. Nachfragen, genau für diese Aktionen

Dem Nutzer Titel, Beschreibung und die beiden Befehle zeigen und seine Zustimmung abwarten:

1. `git push -u origin <phasen-branch>`
2. `gh pr create --base rewrite/react --head <phasen-branch> --title "<titel>" --body-file .cache/pr-body.md`

Erst nach einem klaren „ja“ ausführen. `gh` liegt unter Windows ggf. nicht im `PATH` (Pfad: lokale
`CLAUDE.md`). Ist `gh` nicht angemeldet: den Nutzer bitten, `gh auth login` selbst auszuführen.
Nie Tokens lesen, setzen oder ausgeben.

## 4. Danach

- Den PR-Link nennen. Gibt es eine CI (ab P03-S00): den aktuellen Stand der Checks einmal nennen
  (`gh pr checks <nummer>`), nicht abwarten oder wiederholt abfragen.
- Nie mergen, approven, schließen, Auto-Merge einschalten oder Branches löschen. Gemergt wird vom
  Nutzer per Merge-Commit.
- Den PR-Link trägt der erste Schritt der nächsten Phase in `STATUS.md` ein, damit auf dem
  PR-Branch kein Extra-Commit nötig ist.
