# P07-S06 – M4-Abnahme (Funktionsparität)

Meilenstein M4 · Abhängig von: P07-S05 · Umfang S

## Ziel
Jeder Punkt des Funktionsinventars ist umgesetzt oder als bewusste Abweichung (ADR-011) dokumentiert.
Der Nutzer bestätigt, dass die neue App das Altsystem ersetzt.

## Schritte
1. `01-referenz-altsystem/01-funktionsinventar.md` Zeile für Zeile durchgehen; in `STATUS.md` eine
   Tabelle „Inventar-ID → Status (✔ / ADR-011 Ax / offen)“ anlegen.
2. `pnpm check`, `pnpm test:parity`, `pnpm build`, `pnpm audit --prod`.
3. Nutzer prüft im Browser die offenen Punkte und alle Einstellungen.
4. Offene Punkte entweder beheben (eigene kleine Aufgabe) oder mit dem Nutzer als akzeptiert markieren.

## Akzeptanzkriterien
- [ ] Inventar vollständig abgehakt; Nutzer hat M4 bestätigt.

## Commit-Vorschlag
`docs(docs): record M4 feature parity`
