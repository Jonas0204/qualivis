# P05-S12 – M2-Abnahme (Sichtvergleich)

Meilenstein M2 · Abhängig von: P05-S11 · Umfang S

## Ziel
Der Nutzer vergleicht neuen und alten Graph nebeneinander und gibt M2 frei. Ein KV-Einstieg ist
vorläufig per Doppelklick möglich (vollständige Navigation in P06).

## Schritte
1. Falls noch nicht vorhanden: Doppelklick auf Komponentenknoten mit Funktionen setzt
   `componentIdAtom` (G3) – vorläufig ohne URL.
2. `pnpm check`, `pnpm test:parity` (G1 + G2), `pnpm build`; Bundle prüfen: kein `d3-selection`,
   kein `d3-zoom` enthalten.
3. Checkliste für den Nutzer (Alt: `pnpm legacy:serve`, Neu: `pnpm dev`, gleiche Fenstergröße):
   - [ ] AV `mini`/`realworld`: Größen, Farben, Schraffur, Icons, Vorschaukreise, „...“, Pfeile,
         gestrichelte Vererbung.
   - [ ] KV `App` (mini): Lifecycle-Reihenfolge links → rechts, `render` mit Doppelrand, Icons.
   - [ ] KV mit Clustern: „Toggle cluster“ färbt wie im Altsystem.
   - [ ] Zoom, Pan, Fit, 100 %, Ziehen, Ausblenden, Strg+Hover, Strg+Klick, Hintergrund-Klick.
   - [ ] Legende in beiden Ansichten.
   - [ ] Labels verschwinden bei Überlappung.
4. Ergebnisse und Abweichungen in `STATUS.md`; kleine Abweichungen als Aufgaben notieren und vor
   P06 beheben oder mit dem Nutzer als „akzeptiert“ markieren.

## Akzeptanzkriterien
- [ ] Nutzer hat M2 bestätigt.

## Commit-Vorschlag
`docs(docs): record M2 acceptance`
