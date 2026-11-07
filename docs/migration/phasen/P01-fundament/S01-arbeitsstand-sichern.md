# P01-S01 – Arbeitsstand sichern, Branch anlegen

Meilenstein M0 · Abhängig von: – · Umfang S

> **Erledigt am 07.11.2026:** Branch `rewrite/react` angelegt, Plan dort committet, lokale
> `CLAUDE.md` angelegt. Die Karte bleibt als Dokumentation; auf einem anderen Rechner (z. B. dem
> Laptop) nur Schritt 4 ausführen.

## Ziel
Der Plan (`docs/migration/`) ist committet, und die Umsetzung läuft auf einem eigenen Branch, damit
`master` bis zur Fertigstellung das lauffähige Altsystem bleibt.

## Kontext
- Globale Nutzerregeln (Commits nur auf Anweisung, keine History-Umschreibung) und die **lokale**
  `CLAUDE.md` im Repo-Root (Commit-Identität, Push nach Nachfrage). Die lokale Datei ist nicht
  versioniert (`.gitignore`).

## Dateien
Keine neuen.

## Schritte
1. `git status` ausführen und dem Nutzer zeigen.
2. Sind `docs/migration/**` noch nicht committet: dem Nutzer einen Commit vorschlagen (Commit-Vorschlag
   unten) und nur auf Anweisung committen – mit der Identität aus der lokalen `CLAUDE.md`.
3. Branch `rewrite/react` anlegen (`git switch -c rewrite/react`), falls noch nicht vorhanden.
4. Auf einem weiteren Rechner: Repo klonen/aktualisieren, `git switch rewrite/react`; die lokale
   `CLAUDE.md` dort bei Bedarf selbst anlegen (sie wird nicht mitgepusht).
5. `STATUS.md` → P01-S01 auf „erledigt“.

## Akzeptanzkriterien
- [ ] Arbeitsverzeichnis sauber (`git status` ohne Änderungen), Plan ist Teil eines Commits.
- [ ] Aktueller Branch ist `rewrite/react`.

## Prüfen
`git status`, `git branch --show-current`, `git log --oneline -3`

## Fallstricke
- `git switch` bei uncommitteten Änderungen nur, wenn nichts verloren geht. Im Zweifel fragen.

## Nicht tun
- Kein Remote anlegen, keine Git-Config ändern; Push nur nach Nachfrage (lokale `CLAUDE.md`).

## Commit-Vorschlag
`docs(repo): add migration plan for React rewrite`
