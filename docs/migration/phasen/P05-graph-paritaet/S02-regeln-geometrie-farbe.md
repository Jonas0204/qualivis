# P05-S02 – Regeln: Vorschau-Geometrie, Kanten, Clusterfarben

Meilenstein M2 · Abhängig von: P05-S01 · Umfang M

## Ziel
Alle geometrischen Formeln (Vorschaukreise, „...“, Kanten-Endpunkte, Hauptradius) und die
Farbaufhellung für Cluster als reine Funktionen in `@qualivis/core/rules`.

## Kontext
- §4 (Clusterfarben), §5 (Vorschau-Geometrie), §6 (Radien), §8 (Kanten)
- Altcode: `graph.component.ts:317-321, 811-857, 984-1028, 1130-1156, 615-642`

## Dateien
`packages/core/src/rules/previewGeometry.ts` (+ Test), `linkGeometry.ts` (+ Test; verschiebt
`shortenToTarget` aus `apps/web/src/features/graph/geometry.ts` hierher), `color.ts` (+ Test),
`tools/legacy/capture-cluster-colors.browser.js`, `testdata/golden/mini/legacy-cluster-colors.json`.

## Schritte
1. `previewGeometry.ts`:
   ```ts
   export const previewWidth: number;                       // 14
   export function mainRadius(width: number, view: View): number
   export function outerRadius(width: number, view: View): number  // mainRadius + 0.5 + 3.5
   export function indexAngle(index: number, radius: number): number
   export type PreviewCircle = { id: string; cx: number; cy: number; hidden: boolean; className: string };
   export function previewCircles(parentWidth: number, functions: Node[]): PreviewCircle[]   // AV only
   export function previewDots(parentWidth: number, functions: Node[]): { x: number; y: number } | undefined
   ```
   Achtung V6: Radius der Vorschaukreise wird aus der **Breite des Elternknotens** berechnet, in der
   AV (`mainRadius(width, 'app')`). Klassen: `function <type>` + ` jsx` + ` special`.
2. `linkGeometry.ts`: `linkEnd(source, target, targetMainRadius)` → `{ x, y }` (Ende um
   `targetMainRadius + 0.5` verkürzt). Bei `distance === 0` liefert das Altsystem `NaN`
   (Division durch 0) – Verhalten beibehalten und im Test dokumentieren; die UI rendert die Kante dann
   nicht (Filter in S05).
3. `color.ts` – Ersatz für `d3.hsl(color)` + Aufhellung + `toString()` aus d3-color 1.4 (Algorithmus
   unten, ISC). Exporte: `clusterColor(index: number | string): string` (Altlogik
   `clusterColorScale`), `brightenColor(color: string, amount: number): string`.
   ```text
   Parse: '#rrggbb' → r,g,b (0..255); 'white' → 255,255,255 (nur diese Formen kommen vor).
   RGB→HSL (d3-color hslConvert): r/=255 … ; min, max; h = NaN; s = max - min; l = (max + min) / 2;
     wenn s ≠ 0: h = r==max ? (g - b) / s + (g < b) * 6 : g==max ? (b - r) / s + 2 : (r - g) / s + 4;
                s /= l < 0.5 ? max + min : 2 - max - min; h *= 60
     sonst: s = (l > 0 && l < 1) ? 0 : h          (also NaN bei Weiß/Schwarz)
   Aufhellen: l = l + (1 - l) * amount
   HSL→RGB: h = h % 360 + (h < 0) * 360; s = (isNaN(h) || isNaN(s)) ? 0 : s;
     m2 = l + (l < 0.5 ? l : 1 - l) * s; m1 = 2 * l - m2;
     f(h) = (h < 60 ? m1 + (m2 - m1) * h / 60 : h < 180 ? m2 : h < 240 ? m1 + (m2 - m1) * (240 - h) / 60 : m1) * 255
     r = f(h >= 240 ? h - 240 : h + 120), g = f(h), b = f(h < 120 ? h + 240 : h - 120)
   toString: 'rgb(' + clamp(round(r)) + ', ' + clamp(round(g)) + ', ' + clamp(round(b)) + ')'
     mit clamp(x) = max(0, min(255, Math.round(x) || 0))
   ```
4. Referenzwerte aus dem Altsystem erfassen (Ground Truth für `color.ts`): Skript
   `capture-cluster-colors.browser.js` – im Legacy-Build nach `qvCapture('mini')` die KV von `App`
   öffnen (Doppelklick), Button „Toggle cluster“ klicken, für jeden Knoten mit `__data__.cluster`
   speichern: `{ cluster, fill: circleNode.style.fill, stroke: overlay.style.stroke }`, per POST nach
   `testdata/golden/mini/legacy-cluster-colors.json`. (Im Spike hatte die KV `App` Cluster 0–6.)
5. Tests:
   - Geometrie: für eine Elternbreite 54.68 (Wert von `App` aus `legacy-dom-app.json`) und 10
     Funktionen: `cx/cy`, `hidden` und Klassen gleich den Werten in `legacy-dom-app.json`
     (Toleranz 1e-9). Damit ist S02 schon gegen das Altsystem geprüft, bevor G2 (S04) alles abdeckt.
   - `previewDots` liefert genau dann eine Position, wenn ein Kreis ausgeblendet wird.
   - `linkEnd((0,0), (100,0), 24)` → `(75.5, 0)`.
   - Farben: (a) alle Einträge aus `legacy-cluster-colors.json` exakt; (b) `brightenColor('white', 0.75)
     === 'rgb(255, 255, 255)'`; (c) `clusterColor(20) === 'white'`, `clusterColor('3') === '#1d5ebf'`.

## Akzeptanzkriterien
- [ ] Geometrie identisch zu den Legacy-Werten von `App` (AV).
- [ ] Clusterfarben identisch zu `legacy-cluster-colors.json`.
- [ ] `pnpm check` grün; `apps/web` nutzt `linkEnd` aus dem Kern (keine Doppelung).

## Fallstricke
- `style.fill` liefert im Browser `rgb(r, g, b)` – genau das Format von d3. Wenn Chrome einen anderen
  Text liefert (z. B. ohne Leerzeichen), beim Vergleich Leerraum entfernen, aber nur dort.
- `indexAngle` nutzt `(ps + sw / 2) * 2 = 7`; nicht vereinfachen, sondern mit benannten Konstanten
  aus `graphSettings` rechnen (Rundungsgleichheit).

## Nicht tun
- Kein `d3-color` installieren (ADR-003).

## Commit-Vorschlag
`feat(core): add preview geometry, link geometry and cluster color rules`
