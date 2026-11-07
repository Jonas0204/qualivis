# P05-S07 – Zoom und Pan

Meilenstein M2 · Abhängig von: P05-S06 · Umfang M

## Ziel
Mausrad-Zoom, Verschieben, „Zoom to fit“ (automatisch nach dem ersten Layout und per Button),
„100 %“ und Zoomanzeige – ohne d3-zoom, mit dem Verhalten des Altsystems.

## Kontext
- §10 (inkl. Eigenheit V5); Funktionsinventar G9–G12, G17
- Altcode: `graph.component.ts:472-528, 1058-1089`; d3-zoom-Standardverhalten (siehe unten)

## Dateien
`apps/web/src/features/graph/zoomMath.ts` (+ Test), `usePanZoom.ts` (+ Test), `GraphCanvas.tsx`,
`GraphView.tsx`.

## Schritte
1. `zoomMath.ts` (rein, testbar):
   - `fitTransform(bounds, viewport, padding = 0.95, forceScale?)` → `{ k, x, y } | undefined`
     exakt nach `zoomToFit` (undefined bei Breite/Höhe 0; max. Faktor 3).
   - `zoomAt(transform, pointer, factor)` → neuer Transform, Punkt unter dem Mauszeiger bleibt fest.
   - `wheelFactor(deltaY, deltaMode)` wie d3-zoom: `2 ** (-deltaY * (deltaMode === 1 ? 0.05 : deltaMode ? 1 : 0.002))`.
   - Grenzen wie d3-zoom-Standard: `scaleExtent [0, ∞)` (d3 hat keine Grenze) – Faktor nicht begrenzen.
   - `labelFontSize(k)` → `14 * k > 20 ? 20 / k : undefined` (undefined = unverändert lassen, V5);
     `linkStrokeWidth(k)` → `0.8 * k > 1.6 ? 1.6 / k : undefined`.
2. `usePanZoom(svgRef)` → `{ transform, zoomToFit(bounds?), zoomTo100(), handlers }`:
   - `wheel` (mit `preventDefault`, passiver Listener **aus** – per `addEventListener` mit
     `{ passive: false }` im Effekt, nicht über React-Prop) → `zoomAt`; setzt „Übergang an“
     (`transition: transform 0.1s ease-out` auf der Zoom-Gruppe und Label-Schrift).
   - `pointerdown` auf Hintergrund → Übergang aus, Pan beginnt (Pointer-Capture); `pointermove` →
     verschieben; `pointerup` → Ende. Kein Doppelklick-Zoom.
   - `zoomToFit` animiert 250 ms (`cubic-in-out`, per `requestAnimationFrame`-Interpolation von
     `{k, x, y}` – Interpolation linear in `k`, `x`, `y` genügt, da es nur ums Einpassen geht).
   - Zoomstufe `round(k * 100)` für die Anzeige.
3. Label-/Kantenkappung: `GraphView` hält `labelFontSize`/`linkStrokeWidth` in State und setzt sie
   nur, wenn die Funktion einen Wert liefert (V5: kein Zurücksetzen beim Herauszoomen; beim Neustart
   des Graphen zurück auf 14/0.8).
4. Automatik: Beim **ersten** `end` des Layouts und `settings.autoZoom` → `zoomToFit()`. Den
   vorläufigen `viewBox`-Ansatz aus P04-S05 entfernen.
5. Bounding-Box: `zoomGroupRef.current.getBBox()` (im Browser). In Tests über injizierte
   Messfunktion.
6. Tests:
   - `fitTransform`: Bounds `{x: 0, y: 0, w: 200, h: 100}`, Viewport 400×400 → `k = min(0.95 / max(0.5, 0.25), 3) = 1.9`, zentriert.
   - `forceScale 1` → `k = 1`, Mittelpunkt zentriert.
   - `zoomAt`: Punkt unter dem Zeiger bleibt an derselben Bildschirmposition.
   - `labelFontSize(2) === 10`, `labelFontSize(1) === undefined`.
   - Hook: Wheel-Ereignis ändert `transform.k`.

## Akzeptanzkriterien
- [ ] Nach dem Laden ist der Graph eingepasst; Mausrad zoomt um den Zeiger; Ziehen verschiebt.
- [ ] Button „{n}%“ zeigt die Zoomstufe; Klick → 100 %, zentriert.
- [ ] Tests grün; `pnpm check` grün.

## Fallstricke
- React registriert `onWheel` passiv → `preventDefault` wirkungslos. Deshalb nativer Listener.
- Pan darf nicht starten, wenn auf einem Knoten gedrückt wird (Knoten-Drag in S08):
  `event.target` prüfen bzw. `stopPropagation` im Knoten.

## Nicht tun
- Kein `d3-zoom`.

## Commit-Vorschlag
`feat(web): add pan and zoom with zoom-to-fit`
