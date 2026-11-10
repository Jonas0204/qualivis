---
name: schritt-umsetzen
description: Setzt einen Schritt des Qualivis-Migrationsplans um (Schritt-Karte docs/migration/phasen/Pnn-*/Syy-*.md, z. B. P07-S01). Verwenden, wenn der Nutzer "nächster Schritt", "setze P07-S01 um" oder "mach mit dem Plan weiter" sagt.
---

# Schritt umsetzen

Eingabe: optional eine Schritt-ID wie `P07-S01`. Ohne ID gilt der nächste offene Schritt.

## 1. Schritt bestimmen

- `docs/migration/STATUS.md`, Tabelle „Schritte“: die genannte ID, sonst die erste Zeile mit ☐.
- In der Karte die Zeile „Abhängig von“ prüfen: Alle genannten Schritte müssen ☑ sein. Sonst
  stoppen und melden.
- Karten `S00` in P08–P11 heißen „vor Beginn verfeinern“: Dann zuerst die Karten der Phase mit dem
  Nutzer ausarbeiten, nicht losbauen.
- Schritt 0 einer Karte (z. B. „Vorher nachfragen“) gilt vor allem anderen.

## 2. Branch prüfen

- `git status` muss sauber sein, sonst den Nutzer fragen.
- Sollbranch: Spalte „Branch“ der Tabelle „Phasen“ in `STATUS.md` (`rewrite/pNN-<name>`).
- Gibt es ihn noch nicht (erster Schritt der Phase): `git switch rewrite/react`,
  `git pull --ff-only origin rewrite/react`, `git switch -c <sollbranch>`. Fehlt in der Tabelle
  „Phasen“ der Link zum PR der vorigen Phase, ihn jetzt eintragen (`gh pr list --state merged`).
- Steht der Arbeitsstand auf einem anderen Branch: stoppen und fragen.

## 3. Lesen, nur das

`AGENTS.md` (Leseweg, Abkürzungen), README-Regeln R1–R10, Phasen-README, Karte, die unter „Kontext“
genannten Abschnitte und die Zusatzlektüre aus der Tabelle in `AGENTS.md`. Nichts auf Vorrat lesen.

## 4. Umsetzen

- Genau die Karte: Abschnitte „Dateien“, „Schritte“, „Nicht tun“. Nichts für spätere Schritte.
- Installation nötig: Befehl, Pakete mit Version und Zweck nennen, Zustimmung abwarten.
- Widersprechen sich Karte, Code und Referenz, oder schlägt etwas unerklärlich fehl: stoppen,
  Befund melden, fragen (R9). Abweichungen nur mit Zustimmung.
- Übernommene Eigenheiten mit Kommentar markieren:
  `// Legacy quirk K3: … (see docs/migration/01-referenz-altsystem/…)`.

## 5. Prüfen

`pnpm format`, dann `pnpm check` und die Befehle aus „Prüfen“ der Karte. Jedes Akzeptanzkriterium
einzeln abhaken. Nichts abschwächen, um grün zu werden.

## 6. Status und Bericht

- `STATUS.md`: Zeile des Schritts auf ☑ (◐, wenn nur teilweise erledigt), Datum, Kurznotiz.
  Abweichungen zusätzlich unter „Abweichungen und Notizen“.
- Bericht an den Nutzer: was getan wurde, Prüfergebnisse (bei Fehlern mit Ausgabe), Abweichungen,
  offene Punkte, `git status` in Kurzform, Commit-Vorschlag aus der Karte (Format
  `05-konventionen.md` §8, Body mit `Plan: Pnn-Syy`).
- **Uncommittet lassen.** Committet wird erst auf Anweisung des Nutzers, mit der Identität aus der
  lokalen `CLAUDE.md`. Ohne Nachfrage nie pushen.
