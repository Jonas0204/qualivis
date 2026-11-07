# P06-S06 – Drill-down, URL-Zustand, Browser-Zurück

Meilenstein M3 · Abhängig von: P06-S03 · Umfang M

## Ziel
Die Komponenten-Ansicht ist über `?id=<datei>#<Komponente>` adressierbar: Doppelklick im Graph und im
Dateibaum öffnet sie, Zurück-Button und Browser-Zurück schließen sie, Neuladen behält sie
(sofern die Analyse gespeichert ist, P07-S05).

## Kontext
- Funktionsinventar N5, N9–N11, N13, G3, F5, F6; ADR-011 A1 (Deep-Link-Korrektur)
- Altcode: `graph.component.ts:98-135, 693-701, 1122-1128`, `file-tree.component.ts:81-95`

## Dateien
`apps/web/src/app/useUrlState.ts` (+ Test), `apps/web/src/state/viewAtoms.ts`,
`apps/web/src/app/App.tsx`, `GraphView.tsx`, `FileTree.tsx`.

## Schritte
1. `useUrlState()` synchronisiert `componentIdAtom` ⇄ URL: `componentId` ⇄ URL-Suchparameter `id`:
   - Atom → URL: `history.pushState` (neuer Eintrag) bei Drill-down/Zurück; `replaceState` beim Start.
   - URL → Atom: `popstate` (Browser-Zurück/Vor).
   - Pfad bleibt erhalten (Basis `./`); nur `?id=` ändert sich. Ohne `id`: Suchparameter entfernen.
2. Drill-down (AV): Doppelklick auf Knoten mit `id.startsWith('/')` und `functions.length >= 1` →
   `componentId = id`. Danach (wie Altsystem) die Datei der Komponente auswählen (`selectFile`).
3. Zurück-Button (`arrow_back`, nur KV) → `componentId = undefined`.
4. Dateibaum: Klick → nach 500 ms `componentId = undefined`; Doppelklick (eine Komponente) →
   `componentId = file#comp`.
5. Ungültige `id` (Datei/Komponente unbekannt) → AV (Altsystem N9), URL bereinigen.
6. Einzelkomponenten-Projekt: immer KV-Graph (N9), Zurück-Button nicht anzeigen (Altsystem zeigt ihn
   nur bei gesetztem `id`).
7. Größenmetrik beim Wechsel in die KV ggf. auf `sloc.physical` zurücksetzen (N11).
8. Tests (jsdom, `window.history`): Drill-down setzt `?id=` (URL-kodiert), `popstate` zurück leert
   `componentId`; Start mit `?id=…` und vorhandener Analyse öffnet KV; unbekannte `id` → AV.

## Akzeptanzkriterien
- [ ] Browser-Zurück/Vor funktioniert zwischen AV und KV.
- [ ] Link mit `?id=` öffnet nach Neuladen die KV (nach P07-S05; vorher: wenn Analyse im Speicher).
- [ ] Tests grün; `pnpm check` grün.

## Fallstricke
- `#` in der Komponenten-ID muss in der URL kodiert sein (`%23`), sonst wird es zum Fragment.
- Kein Router-Paket.

## Commit-Vorschlag
`feat(web): add component drill-down with URL state`
