# P06-S01 – SplitPane und Panel-Layout

Meilenstein M3 · Abhängig von: M2 · Umfang M

## Ziel
Die Graph-Seite ist in drei verschiebbare Spalten (275 px | Rest | 575 px) geteilt, die rechte
vertikal (363 px | Rest), Trenner 8 px `#eee`. Vollbild blendet linke und rechte Spalte aus.

## Kontext
- Funktionsinventar §9, G13; Stil-Referenz §3; Altcode `graph-view.component.html/.scss`,
  angular-split-CSS (`anhang`-frei, Werte in der Stil-Referenz)

## Dateien
`apps/web/src/ui/SplitPane.tsx`, `SplitPane.module.css`, `SplitPane.test.tsx`,
`apps/web/src/features/graph/GraphPage.tsx` (Seite mit Panels), `GraphPage.module.css`.

## Schritte
1. `SplitPane({ direction: 'horizontal' | 'vertical', areas, gutterSize = 8 })` mit
   `areas: Array<{ key: string; size: number | '*'; visible?: boolean; children: ReactNode }>`:
   - Pixelgrößen, genau ein `*`-Bereich nimmt den Rest (`flex: 1`); Mindestgröße 0.
   - Trenner zwischen sichtbaren Bereichen: 8 px, `#eee`, Cursor `col-resize`/`row-resize`, Griff-Icon
     wie angular-split (Base64-Bild aus der Stil-Referenz ist optional; einfache Punkte reichen nicht –
     das Bild aus `legacy`-Bundle übernehmen, siehe Fallstricke).
   - Ziehen am Trenner (Pointer Events) ändert die Größen der Nachbarbereiche; Tastatur: Trenner ist
     fokussierbar (`role="separator"`, `aria-orientation`, Pfeiltasten ±10 px).
   - Unsichtbare Bereiche: Breite 0, Inhalt bleibt gemountet (Zustand bleibt erhalten).
   - Bereiche `overflow: hidden auto`; Hintergrund weiß (`.as-split-area { background: white }`).
2. `GraphPage`: horizontal `[fileTree 275, graph *, right 575]`, rechts vertikal
   `[codeQuality 363, sourceCode *]`. Platzhalter für Panels, die in S03–S05 entstehen. Vollbild-Flag
   steuert `visible`; bei Änderung `zoomToFit()` im Graph auslösen (über Callback/Ereignis).
   Drop auf die ganze Seite und Overlay folgen in P07-S05.
3. Tests: Größen werden als Stil gesetzt; Ziehen um +50 px vergrößert linken Bereich um 50, verkleinert
   den Stern-Bereich; Pfeiltaste ändert um 10; unsichtbarer Bereich hat Breite 0, Trenner entfällt.

## Akzeptanzkriterien
- [ ] Layout entspricht dem Altsystem (Sichtvergleich bei 1280 × 800 und 1920 × 1080).
- [ ] Vollbild blendet Seitenspalten aus und passt den Graph ein.
- [ ] Tests grün; `pnpm check` grün.

## Fallstricke
- Der Griff im Trenner ist im Altsystem ein kleines PNG (Base64, im kompilierten Bundle bei
  `.as-split-gutter-icon`). Aus `.cache/legacy-build/main-es2015.*.js` die zwei `data:image/png`-URLs
  (horizontal/vertikal) übernehmen.
- Nach Größenänderung der Graph-Spalte startet das Altsystem das Layout **nicht** neu.

## Commit-Vorschlag
`feat(web): add split layout with resizable panels`
