# P05-S06 – WebCola-Adapter und Engine-Wahl

Meilenstein M2 · Abhängig von: P05-S05 · Umfang M

## Ziel
WebCola („Vertical flow layout“) ist Standard; ohne d3-Adapter angebunden, animiert über
`requestAnimationFrame`, mit Drag-Unterstützung. Das Kraft-Layout bleibt als Alternative.

## Kontext
- §9.1, §9.2, §9.4, §11; `anhang/A6` V8 (Deep-Import erprobt)
- WebCola-API: `Layout` (`dist/src/layout`): `size, nodes, links, constraints, avoidOverlaps,
  flowLayout, symmetricDiffLinkLengths, start(a, b, c, d?, keepRunning?, centerGraph?)`, `on(type, fn)`,
  geschützt `trigger(e)`, `kick()`, `tick(): boolean`, `resume()`, `stop()`, statisch
  `Layout.dragStart(d)`, `Layout.drag(d, {x, y})`, `Layout.dragEnd(d)`.
- Referenz-Adapter: `webcola/dist/src/d3v4adaptor.js` (`kick` = `timer(() => tick() && t.stop())`).

## Dateien
`apps/web/src/features/graph/layout/colaLayout.ts` (+ Test), `layout/createLayout.ts`,
`GraphView.tsx` (Engine-Wahl), `apps/web/package.json` (`webcola`), ggf. `src/types/webcola.d.ts`.

## Schritte
1. Abhängigkeit `webcola` (Catalog) in `apps/web` eintragen; Nutzer `pnpm install` ausführen lassen.
2. `colaLayout.ts`:
   ```ts
   import { Layout, type Event as ColaEvent, EventType } from 'webcola/dist/src/layout';

   /** WebCola layout animated with requestAnimationFrame instead of d3-timer (ADR-003). */
   class AnimatedColaLayout extends Layout {
     private frame: number | undefined;
     private readonly listeners = { tick: new Set<() => void>(), end: new Set<() => void>() };
     protected override trigger(e: ColaEvent): void {
       const type = e.type === EventType.tick ? 'tick' : e.type === EventType.end ? 'end' : undefined;
       if (type) for (const l of this.listeners[type]) l();
     }
     protected override kick(): void {
       const step = () => { this.frame = super.tick() ? undefined : requestAnimationFrame(step); };
       if (this.frame === undefined) this.frame = requestAnimationFrame(step);
     }
     // + addListener/removeListener, cancel() (cancelAnimationFrame)
   }
   ```
   `createColaLayout({ nodes, links, width, height, constraints })` gibt ein `LayoutEngine`-Objekt
   zurück; `start()` ruft die Kette aus §9.1 mit `.start(40, 20, 20)` auf. `drag*` delegieren an die
   statischen `Layout.drag*`-Methoden + `resume()`; `dragEnd(node, { pin })` ignoriert `pin`
   (Altverhalten: kein Shift-Fixieren im WebCola-Modus).
   Hinweis: WebCola erwartet in `links` Indizes oder Knotenobjekte; Objekte übergeben.
3. `createLayout(settings.colaLayout, args)` wählt die Engine; Constraints nur in der KV.
4. `GraphView`: Engine neu erzeugen bei Änderung von Graph, Ansicht, Größenmetrik, `colaLayout`,
   `nodeSizesBasedOnMetrics`, Containergröße (beim **ersten** Messen; spätere Größenänderungen starten
   das Layout im Altsystem nicht neu – nur Fullscreen löst `zoomToFit` aus).
5. Tests:
   - `colaLayout` in jsdom mit `requestAnimationFrame`-Fake (Vitest `vi.useFakeTimers({ toFake:
     ['requestAnimationFrame'] })` oder eigener Stub): nach Ablauf `end` gemeldet, alle Knoten haben
     endliche `x/y`.
   - Flow-Layout: in einer Kette `A → B → C` gilt `A.y < B.y < C.y` (vertikaler Fluss).
   - Determinismus: zweimal gleiche Eingabe → gleiche Positionen.
   - Constraints: `constructor.x + 100 <= componentDidMount.x` (Toleranz 1).
6. Optional (G3): Positionen der AV von `mini` mit Containergröße aus `legacy-dom-app.json`
   (`container`) relativ zum Schwerpunkt mit den Legacy-Werten vergleichen (±0,5 px). Schlägt der
   Vergleich fehl, ist das **kein** Blocker (ADR-003); Ergebnis in `STATUS.md` notieren.

## Akzeptanzkriterien
- [ ] Standardmäßig WebCola: Komponenten in Ebenen von oben nach unten, wie im Altsystem.
- [ ] KV einer Klassenkomponente: Lifecycle-Methoden von links nach rechts in `reactMethods`-Reihenfolge.
- [ ] Engine-Wechsel ohne Neuladen; keine laufenden Animationen nach Verlassen der Ansicht.
- [ ] Tests grün; `pnpm check` grün.

## Fallstricke
- `trigger`/`kick` sind in den Typdefinitionen `protected` – `override` nutzen, nicht casten.
- Import aus `webcola` (Paket-Root) zieht den d3-Adapter mit d3 v1 ins Bundle – **nur**
  `webcola/dist/src/layout` importieren. Nach dem Build prüfen, dass `d3-selection` nicht im Bundle ist
  (`dist/assets/*.js` nach „d3-selection“ durchsuchen bzw. Bundle-Größe vergleichen).

## Nicht tun
- Kein Import von `d3adaptor`/`d3v4adaptor`.

## Commit-Vorschlag
`feat(web): add WebCola flow layout adapter without d3`
