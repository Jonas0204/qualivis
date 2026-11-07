# P05-S11 – Legende, Aktionsleiste, UI-Bausteine

Meilenstein M2 · Abhängig von: P05-S10 · Umfang M

## Ziel
Legende (AV/KV) und die Aktionsleisten über dem Graph sehen aus und funktionieren wie im Altsystem:
Zurück (KV), „Toggle cluster“ (KV mit Clustern), Größenmetrik-Auswahl, „{n}%“, „Zoom to fit“,
Vollbild.

## Kontext
- §15 (Legende, exakte Geometrie); Funktionsinventar G11–G15, N11, N13; Stil-Referenz §2, §3
- Altcode: `graph.component.html:31-218`, `graph.component.scss:11-37, 157-183`

## Dateien
```
apps/web/src/ui/Button.tsx  IconButton.tsx  Tooltip.tsx  Select.tsx  (+ *.module.css, + Tests)
apps/web/src/features/graph/Legend.tsx  Legend.test.tsx
apps/web/src/features/graph/GraphActions.tsx  GraphActions.test.tsx
apps/web/src/state/viewAtoms.ts (Vollbild-Flag vorerst als eigenes Atom, ab P07 Teil von settingsAtom)
```

## Schritte
1. UI-Bausteine (ohne Fachwissen, Material-Optik aus der Stil-Referenz):
   - `Button` (`variant: 'text' | 'stroked' | 'raised'`, `color?: 'primary'`), Höhe 36 px (Text) bzw.
     wie Material, Schrift 500 14 px, Radius 4 px, Innenabstand `0 16px`.
   - `IconButton` (40 × 40, rund, `aria-label` Pflicht-Prop, Kind = `Icon`).
   - `Tooltip` – einfache Variante über `title`-Attribut **reicht nicht** für Parität; eigene Komponente
     mit `aria-describedby`, Anzeige nach 500 ms Hover/Fokus unterhalb, Hintergrund
     `--qv-tooltip-bg`, Schrift 10 px weiß, Radius 4 px, Innenabstand `6px 8px`.
   - `Select` – Material-artiger Auswahlknopf (Wert + Dreieck, Breite 180 px, Schrift 16 px, Farbe
     über Prop), Liste als `role="listbox"` mit `role="option"`; Tastatur: Pfeile, Enter, Escape;
     schließt bei Klick außerhalb. Optionen aus Prop `options: Array<{ value: string; label: string }>`.
   - Je Baustein ein Verhaltenstest (Rolle/Label, Klick, Tastatur beim Select).
2. `Legend({ view })`: SVG exakt nach §15 (Größe, `viewBox`, Einträge, `y`-Positionen, Radien,
   Deckkraft, Klassen; Schraffur über die Defs-ID des Graphen). Inline-Snapshot je Ansicht.
3. `GraphActions` (links: Zurück nur in KV; rechts: Cluster, Select, Zoom-%, Fit, Vollbild), Position
   und Farben nach `graph.component.scss:11-37` (Farbe `--qv-graph-button`).
   - Select-Optionen: AV alle 7 Metriken (Namen aus `qualityMetrics`), KV ohne `componentOnly`.
     Wechsel → Größenmetrik ändern → Layout-Neustart.
   - Beim Wechsel in die KV mit `componentOnly`-Metrik → zurück auf `sloc.physical` (N11).
   - Cluster-Button: sichtbar nur in KV mit `hasCluster`; Klasse „on“ → Hintergrund
     `--qv-cluster-button-on`; Umschalten ändert nur die Färbung (kein Layout-Neustart; Altsystem ruft
     `updateGraph()`).
   - Vollbild: Flag umschalten, danach `zoomToFit()` (Panels gibt es erst in P06; das Flag wird dort
     ausgewertet).
   - Tooltips und `aria-label` exakt: „Back to app graph“, „Node size metric“, „Zoom to 100%“,
     „Zoom to fit“, „Toggle fullscreen“ (Tooltip „Enter fullscreen“/„Exit fullscreen“).
4. Tests: Optionen je Ansicht; Metrikwechsel ruft Callback; Zurück nur in KV sichtbar;
   Cluster-Button nur mit `hasCluster`.

## Akzeptanzkriterien
- [ ] Legende pixelgleich zum Altsystem (Sichtvergleich, beide Ansichten).
- [ ] Alle Aktionen funktionieren; Tooltips/Labels exakt.
- [ ] Tests grün; `pnpm check` grün.

## Fallstricke
- Die Legende nutzt dieselben CSS-Klassen wie Knoten (`circle-node`, `function` …) – deshalb liegt sie
  innerhalb des `.qv-graph`-Containers.
- Der Zurück-Button navigiert in die AV; echte URL-Navigation folgt in P06-S06 – bis dahin
  `componentIdAtom` auf `undefined` setzen.

## Commit-Vorschlag
`feat(web): add legend, graph actions and basic UI controls`
