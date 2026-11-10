# P07-S05 – Analyse speichern/wiederherstellen, Drop-Overlay

Meilenstein M4 · Abhängig von: P07-S04 · Umfang M

## Ziel
Die letzte Analyse überlebt ein Neuladen (inkl. `?id=`-Deep-Link), und auf die Graph-Ansicht kann ein
neuer Ordner gezogen werden („Drop files here“).

## Kontext
- Funktionsinventar N3, N7, P1, U3, U4; ADR-011 A1, A2, A6; Architektur §8
- Altcode: `data.service.ts:162-188`, `graph-view.component.ts:30-47`, `graph-view.component.scss`

## Dateien
`apps/web/src/state/analysisPersistence.ts` (+ Test), `apps/web/src/features/upload/DropOverlay.tsx`
(+ CSS, + Test), `GraphPage.tsx`, `App.tsx`.

## Schritte
1. `analysisPersistence`:
   - `saveAnalysis(result)` → `writeJson('analysis', { version: 1, fileMap, appGraph, report })`.
     Aufruf nach erfolgreicher Analyse **und** bei `pagehide` (statt `beforeunload`, zuverlässiger).
     Bei `false` → Snackbar (S04-Text), nur einmal pro Sitzung.
   - `loadAnalysis()` → validiert `version === 1` und Grundstruktur; sonst `undefined`.
2. Start (`App`): gespeicherte Analyse vorhanden → `analysisAtom` = `done` mit Ergebnis,
   `view = 'graph'`, `componentId` aus der URL (S06 aus P06). Keine gespeicherte Analyse → Upload-Ansicht
   (keine Demo-Daten, A2). Toolbar-Titel → Upload-Ansicht, Analyse bleibt.
3. `DropOverlay`: Graph-Seite nutzt `useFileDrop`; während des Ziehens Overlay („Drop files here“,
   `rgba(0,0,0,.55)`, 32 px weiß, zentriert, `pointer-events: none`, `z-index 999`). Drop → `runAnalysis`
   (setzt Auswahl zurück: `deselect()`). Monorepo (P05.5, ADR-019): Hat der Drop mindestens zwei
   App-Kandidaten, braucht es dieselbe App-Auswahl wie in der Upload-Ansicht (P05.5-S07), hier mit
   dem `Dialog` aus S02. Ob die Auswahl gespeichert wird, vorher mit dem Nutzer klären (O19).
4. Neue Analyse ersetzt die gespeicherte.
5. Tests: Speichern/Laden-Rundlauf (`toEqual`); defekte/alte Daten → `undefined`; Start mit gespeicherter
   Analyse und `?id=` öffnet KV; Drop auf Graph-Seite startet Analyse; Overlay sichtbar nur beim Ziehen.

## Akzeptanzkriterien
- [ ] Neuladen in KV bleibt in KV (Deep-Link funktioniert).
- [ ] `realworld` passt in `localStorage` (Größe der gespeicherten Daten in `STATUS.md` notieren).
- [ ] Tests grün; `pnpm check` grün.

## Fallstricke
- Das gespeicherte Objekt enthält den Quelltext aller Dateien (wie im Altsystem) – Größe kann bei großen
  Projekten das Limit überschreiten → Meldung, kein Absturz (R9).

## Commit-Vorschlag
`feat(web): persist analysis and support dropping onto the graph page`
