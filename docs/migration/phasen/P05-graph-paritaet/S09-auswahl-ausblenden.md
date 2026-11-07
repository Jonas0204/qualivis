# P05-S09 – Auswahl, Ausblenden, Entfernen

Meilenstein M2 · Abhängig von: P05-S08 · Umfang M

## Ziel
Klick wählt einen Knoten aus und blendet (bei „fade“) Unverbundenes aus; Strg+Hover blendet temporär
aus; Klick auf den Hintergrund hebt alles auf; Strg+Klick entfernt einen Knoten aus der Ansicht.

## Kontext
- §12 (Ausblenden), §14 (Auswahl-Darstellung); Funktionsinventar G1, G5–G7
- Altcode: `graph.component.ts:711-809, 1030-1056, 1172-1177`

## Dateien
`packages/core/src/rules/connectivity.ts` (+ Test), `apps/web/src/features/graph/useFade.ts`
(+ Test), `apps/web/src/state/selectionAtoms.ts` (Grundform), `GraphView.tsx`, `GraphNode.tsx`,
`GraphLink.tsx`, `graph.css`.

## Schritte
1. `connectivity.ts` (Kern, rein): `connectedNodes(nodeId, links, { indirect: boolean })` →
   `{ incoming: string[], outgoing: string[], indirect: string[] }` und
   `linkOpacityKeys(...)` bzw. `isLinkHighlighted(link, focusId, outgoingAndIndirect)` – exakt §12
   (BFS über ausgehende Kanten, ohne Fokusknoten, ohne Doppelte).
   Tests: Kette `a→b→c→d`, Fokus `b`: incoming `[a]`, outgoing `[c]`, indirect `[d]`; Zyklus terminiert;
   Kante `c→d` hervorgehoben, `a→b` hervorgehoben (berührt Fokus), andere nicht.
2. `useFade(enabled, highlightIndirect)` → `{ focus, fadeTo(nodeId), fadeIn() }`; erzeugt aus dem
   Fokus Sets für Knoten- und Kanten-Deckkraft. Rendering: Deckkraft `1` bzw. `0.1` per Inline-Style mit
   `transition: opacity 250ms` (statt d3-Transition); indirekte Knoten: `circle-node` Füllung `#fafafa`.
3. `selectionAtom` (Grundform, erweitert in P06-S02): `atom<NodeSelection[] | null>(null)`. Knoten-Klick ruft
   vorerst `selectGraphNode(node, componentId)` auf, das nur `{ id, label, type, report, icons }`
   speichert (Code/Zeilen folgen in P06).
4. Verhalten in `GraphView`:
   - Klick (Overlay oder Label): Auswahl + (bei `fade`) `fadeTo`.
   - Strg + Klick: Knoten und seine Kanten aus der **lokalen** Ansicht entfernen, Layout neu starten
     (nicht in der Analyse, nicht persistent).
   - `pointerenter` mit Strg → `fadeTo`; `pointerleave` mit Strg und aktivem Fokus → `fadeIn`.
   - Klick auf den SVG-Hintergrund (Ziel ist das `<svg>` selbst) → `fadeIn` + Auswahl aufheben.
   - Während Drag kein Ausblenden.
   - Ausgewählte Knoten: Klassen/Stroke wie §14 (aus `selectionAtom`).
5. Tests (jsdom, Fake-Engine): Klick setzt Auswahl und Deckkraft (verbundene 1, andere 0.1);
   Hintergrund-Klick setzt alles auf 1 und leert die Auswahl; Strg+Klick entfernt Knoten (Anzahl
   `g.node` sinkt um 1, zugehörige Kanten verschwinden); `fade = false` → keine Deckkraftänderung.

## Akzeptanzkriterien
- [ ] Verhalten entspricht G1, G5–G7 des Funktionsinventars (Sichtvergleich am Altsystem).
- [ ] Tests grün; `pnpm check` grün.

## Fallstricke
- Altsystem setzt Kanten-Deckkraft über das **Attribut** `opacity`, Knoten über **Style** – optisch
  gleich; neu einheitlich per Style.
- `pointerenter` braucht `event.ctrlKey` (bei Mac auch `metaKey`? Altsystem nur `ctrlKey` → nur `ctrlKey`).

## Commit-Vorschlag
`feat(web): add selection, fading and ctrl-click node removal`
