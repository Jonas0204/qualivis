# P04-S06 – M1-Abnahme

Meilenstein M1 · Abhängig von: P04-S05 · Umfang S

## Ziel
Der Nutzer sieht das erste Produkt und gibt M1 frei.

## Schritte
1. `pnpm check` und `pnpm build` ausführen; Bundle-Größe (gzip) aus der Build-Ausgabe notieren.
2. `pnpm audit --prod` ausführen; Ergebnis notieren (bekannte, nicht ausnutzbare Meldungen der
   Altbibliotheken mit Begründung in `STATUS.md`).
3. Dem Nutzer eine kurze Abnahme-Anleitung geben:
   - `pnpm dev` → Toolbar und Upload-Karte prüfen.
   - Ordner `testdata/fixtures/mini` hineinziehen → 8 Knoten, 7 Pfeile.
   - Ordner `testdata/fixtures/realworld` über „browse a folder“ wählen → 32 Knoten, 36 Pfeile.
   - Zum Vergleich `pnpm legacy:serve` und dasselbe im Altsystem.
4. Rückmeldungen des Nutzers in `STATUS.md` notieren; Abweichungen, die in P05 ohnehin behoben
   werden (Größen, Farben je Typ, Zoom), als „erwartet“ markieren.
5. `STATUS.md`: M1 erreicht (Datum).

## Akzeptanzkriterien
- [ ] Nutzer hat M1 bestätigt.
- [ ] `pnpm check`, `pnpm build` grün; Golden G1 grün.

## Commit-Vorschlag
`docs(docs): record M1 acceptance` (nur `STATUS.md`)
