# P06-S03 – Dateibaum

Meilenstein M3 · Abhängig von: P06-S02 · Umfang M

## Ziel
Linkes Panel mit Dateibaum wie im Altsystem: Ordner/Dateien, Aufklappen, Klick wählt Datei (und
nach 500 ms zurück zur AV), Doppelklick öffnet die KV, Auswahl klappt Ordner automatisch auf.

## Kontext
- Funktionsinventar F1–F7; Stil-Referenz §2/§3 (Dateibaum)
- Altcode: `components/file-tree/*`, `helper/extractFileTree.ts` (im Kern: `extractFileTree`)

## Dateien
`apps/web/src/features/file-tree/FileTree.tsx`, `FileTree.module.css`, `FileTree.test.tsx`,
`useTreeState.ts` (+ Test).

## Schritte
1. `useTreeState(tree)`: flache Liste sichtbarer Zeilen (`{ node, level, expandable, expanded }`) aus
   `extractFileTree(fileMap)`; Start: Ebenen 0 und 1 aufgeklappt (F2); `toggle(path)`;
   `expandToFile(fileName)` (F7, Logik von `file-tree.component.ts:63-78`: Teile des Pfads, Ebene `i`).
2. `FileTree`: `role="tree"`, Zeilen `role="treeitem"` mit `aria-level`, `aria-expanded` (Ordner),
   `aria-selected`, `aria-label="toggle <name>"` (Altsystem); Höhe 32 px; Einrückung 28 px × Ebene;
   Icon `folder`/`code` 20 px `rgba(0,0,0,.65)`; Text 13 px.
3. Verhalten (Timer wie `file-tree.component.ts:99-120`):
   - Klick Datei: wenn nicht ausgewählt → `selectFile`; Timer 500 ms → `componentIdAtom =
     undefined` (zur AV). Weiterer Klick setzt Timer zurück.
   - Doppelklick Datei: Timer löschen; hat die Datei genau eine Komponente → KV öffnen.
   - Klick Ordner: auf-/zuklappen.
   - Ausgewählte Datei (erste Auswahl, Dateiteil der ID) hinterlegt.
   - Tastatur (Ergänzung, A11y): Pfeil hoch/runter bewegt Fokus, Enter = Klick, Pfeil rechts/links =
     auf-/zuklappen.
4. Bei jeder Auswahländerung (auch aus dem Graph) `expandToFile` für alle ausgewählten Dateien.
5. Tests (Fake-Timer): Reihenfolge Ordner vor Dateien; Startzustand; Klick wählt und navigiert nach
   500 ms zur AV; Doppelklick öffnet KV und navigiert **nicht** zur AV; Auswahl aus dem Graph klappt
   Ordner auf.

## Akzeptanzkriterien
- [ ] Verhalten F1–F7; Optik wie Altsystem.
- [ ] Tests grün; `pnpm check` grün.

## Commit-Vorschlag
`feat(web): add file tree panel`
