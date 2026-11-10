# P05.5-S08 – Abnahme am echten Monorepo

Ohne Meilenstein (P05.5) · Abhängig von: P05.5-S07 · Umfang S

## Ziel
Der Nutzer prüft die Monorepo-Unterstützung an seinem echten Monorepo und gibt sie frei.

## Kontext
- ADR-019 (Ziel und Grundidee der Phase); ADR-011 A19; RI14, RI15. Die übrigen Schritte S01–S07
  sind umgesetzt (Code in `packages/core/src/workspace/` und `apps/web/src/features/upload/`).
- Die App läuft rein im Browser und schickt nichts ins Netz (Ziele §3); der Nutzer kann sie lokal
  mit eigenem Code nutzen. Inhalte des echten Monorepos kommen nie ins Repo oder in den Chat, nur
  anonymisierte Befunde.

## Schritte
1. `pnpm check`, `pnpm test:parity`, `pnpm build`.
2. Checkliste für den Nutzer (lokal `pnpm dev` oder `pnpm build` + `pnpm preview`; Monorepo-Ordner
   **hineinziehen**, nicht über „browse“, RI15):
   - [ ] Die Auswahl zeigt die erwarteten Apps und Pakete, die Workspace-Wurzel fehlt.
   - [ ] Graph der App: App-Komponenten und benutzte Bibliothekskomponenten; eine bekannt unbenutzte
         Bibliothekskomponente fehlt.
   - [ ] Drei bekannte Verwendungen App → Bibliothek und eine innerhalb der Bibliothek haben Kanten.
   - [ ] Keine Hilfskomponenten aus Testdateien im Graphen.
   - [ ] Zeit vom Hineinziehen bis zum Graphen (grob messen und melden).
   - [ ] „Whole project“ verhält sich wie vorher, nur ohne Test- und Python-Ordner (A19). Das
         Testprojekt `monorepo` ergibt im Browser deshalb 9 statt 11 Knoten (ohne `PageWrapper`,
         `ButtonWrapper`), die drei Kanten bleiben; `monorepo.NOTES.md` gilt für den Kern mit allen
         Dateien.
3. Befunde des Nutzers (nur Zahlen und Muster, keine Namen) in `STATUS.md`; Abweichungen als Aufgaben
   notieren und beheben oder mit dem Nutzer als „akzeptiert“ markieren. Dauert die Analyse
   zu lange, Messwerte an P08-S04 (Worker) weitergeben.

## Akzeptanzkriterien
- [ ] Nutzer hat die Monorepo-Unterstützung bestätigt.

## Fallstricke
- Fehlende Kanten zuerst am Import-Stil eingrenzen (Alias, Paketname, Barrel, `exports`), dann am
  Komponentenmuster. Barrels und `exports` sind bewusst offen (O16).

## Commit-Vorschlag
`docs(docs): record monorepo acceptance`
