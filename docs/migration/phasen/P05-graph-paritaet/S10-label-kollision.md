# P05-S10 – Überlappende Labels ausblenden

Meilenstein M2 · Abhängig von: P05-S09 · Umfang S

## Ziel
Nach Layout-Ende und nach Zoomänderungen werden überlappende Labels (entprellt, 250 ms) ausgeblendet;
ausgeblendete Knoten zeigen ihr Label als Tooltip.

## Kontext
- §13; Funktionsinventar G18; Altcode `graph.component.ts:952-982`, `helper/isColliding.ts`,
  `helper/debounce.ts`

## Dateien
`apps/web/src/lib/isColliding.ts` (+ Test), `lib/debounce.ts` (+ Test),
`apps/web/src/features/graph/labelCollision.ts` (+ Test), `useLabelCollision.ts`, `GraphNode.tsx`.

## Schritte
1. `isColliding(r1, r2)` 1:1 übernehmen (Rechtecke `{x, y, width, height}`, echte Überschneidung).
2. `debounce(fn, wait)` – kleine eigene Version (ohne `immediate`, nicht gebraucht), mit `cancel()`.
3. `labelCollision.ts` – reine Funktion `hiddenLabels(rects: Array<{ id: string; rect: Rect }>)` →
   `Set<string>`: für jedes `i` alle `j < i` prüfen; bei Kollision wird **`j`** ausgeblendet (§13).
   Test: drei überlappende Rechtecke → die zwei früheren sind ausgeblendet; keine Überlappung → leer.
4. `useLabelCollision(enabled)` misst `getBoundingClientRect()` aller `tspan.label-text` (Refs), ruft
   `hiddenLabels` auf und gibt das Set zurück; Auslöser: Layout-Ende und Zoomänderung (entprellt).
   Vor dem Messen alle Labels sichtbar schalten (wie Altsystem), dann ausblenden.
5. `GraphNode`: ausgeblendetes Label → `display: none` am `tspan.label-text` und `<title>` mit dem
   Labeltext am `g.node`.

## Akzeptanzkriterien
- [ ] Bei `realworld` und kleinem Zoom verschwinden überlappende Labels, Tooltip zeigt den Namen.
- [ ] Einstellung `hideOverlappingLabels = false` (bis P07 per Konstante testbar) → nichts ausgeblendet.
- [ ] Tests grün; `pnpm check` grün.

## Commit-Vorschlag
`feat(web): hide overlapping labels after layout and zoom`
