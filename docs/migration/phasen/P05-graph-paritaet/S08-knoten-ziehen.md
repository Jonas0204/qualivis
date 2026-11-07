# P05-S08 – Knoten ziehen

Meilenstein M2 · Abhängig von: P05-S07 · Umfang S

## Ziel
Knoten lassen sich mit der Maus ziehen; das Layout reagiert wie im Altsystem (Kraft-Layout: Shift
beim Loslassen fixiert; WebCola: Drag über die statischen Layout-Methoden).

## Kontext
- §11; Funktionsinventar G8; Altcode `graph.component.ts:703-708, 1091-1120`

## Dateien
`apps/web/src/features/graph/useNodeDrag.ts` (+ Test), `GraphNode.tsx`, `GraphView.tsx`.

## Schritte
1. `useNodeDrag({ engine, transform, onDraggingChange })` → Handler `onPointerDown(node, event)`:
   - Pointer-Capture auf dem `g.node`; Startposition merken; `event.stopPropagation()` (kein Pan).
   - Erstes `pointermove` → `engine.dragStart(node)`; `dragging = true` (Altsystem: erst beim ersten
     `drag`-Ereignis).
   - Jedes `pointermove` → Bildschirm- in Graph-Koordinaten umrechnen (`(clientX - rect.left - x) / k`)
     → `engine.drag(node, pos)`.
   - `pointerup` → `engine.dragEnd(node, { pin: event.shiftKey })`; `dragging = false`.
   - Ein `pointerdown` ohne Bewegung ist ein Klick (Auswahl, S09) – nicht als Drag behandeln.
2. `dragging` wird an das Ausblenden (S09) gemeldet: während eines Drags kein Ausblenden.
3. Tests mit Fake-Engine: Reihenfolge `dragStart → drag(×n) → dragEnd`; `pin` = Shift-Zustand beim
   Loslassen; reiner Klick ruft keine Drag-Methoden; Koordinatenumrechnung mit `k = 2`, Verschiebung
   `(10, 20)`.

## Akzeptanzkriterien
- [ ] Ziehen funktioniert in beiden Layouts; Shift+Loslassen fixiert im Kraft-Layout.
- [ ] Klick auf Knoten wählt weiterhin aus (kein versehentlicher Drag).
- [ ] Tests grün; `pnpm check` grün.

## Commit-Vorschlag
`feat(web): add node dragging for both layouts`
