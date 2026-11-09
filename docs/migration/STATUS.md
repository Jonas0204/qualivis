# Status der Umsetzung

Legende: ☐ offen · ◐ in Arbeit · ☑ erledigt · ⊘ übersprungen (mit Begründung)
Pflege: Nach jedem Schritt Zeile aktualisieren (Datum, Kurznotiz). Meilensteine mit Datum der
Bestätigung durch den Nutzer. Vor dem PR einer Phase werden ihre Zeilen zu einer zusammengefasst
(Skill `phase-abschliessen`).

| Meilenstein | Status | Bestätigt am |
|---|---|---|
| M0 Fundament | ☑ (08.11.2026) | 08.11.2026 (Merge von PR #1) |
| M1 Erstes Produkt | ☑ (09.11.2026) | 09.11.2026 (Nutzer, Sichtvergleich mit dem Altsystem) |
| M2 Graph-Parität | ☐ | |
| M3 Analyse-UI | ☐ | |
| M4 Funktionsparität | ☐ | |
| M5 Härtung | ☐ | |
| M6 Parität E2E | ☐ | |
| M7 Kern als Paket + CLI | ☐ | |
| M8 Abschluss | ☐ | |

## Phasen (Branch und Pull Request)

Ablauf: README, „Branches und Pull Requests“. Ziel aller PRs: `rewrite/react`.

| Phase | Branch | PR | Status |
|---|---|---|---|
| P01 Fundament + P02 Golden-Infrastruktur | `rewrite/m0-fundament` | [#1](https://github.com/Jonas0204/qualivis/pull/1) | ☑ |
| P03 Kern-MVP | `rewrite/p03-kern-mvp` | | ☑ |
| P04 Web-MVP | `rewrite/p04-web-mvp` | [#2](https://github.com/Jonas0204/qualivis/pull/2) | ☑ |
| P05 Graph-Parität | `rewrite/p05-graph-paritaet` | | ◐ |
| P05.5 Monorepo-Unterstützung (eingeschoben, ADR-019) | `rewrite/p05.5-monorepo` | | ☐ |
| P06 Panels, Navigation | `rewrite/p06-panels-navigation` | | ☐ |
| P07 Einstellungen, Persistenz | `rewrite/p07-einstellungen-persistenz` | | ☐ |
| P08 Härtung | `rewrite/p08-haertung` | | ☐ |
| P09 E2E-Parität | `rewrite/p09-e2e-paritaet` | | ☐ |
| P10 Kern-Paket, CLI | `rewrite/p10-core-paket-cli` | | ☐ |
| P11 Abschluss | `rewrite/p11-abschluss` | | ☐ |

## Schritte

| Schritt | Titel | Status | Datum | Notiz |
|---|---|---|---|---|
| P01, P02 | M0: Fundament, Golden-Infrastruktur | ☑ | 08.11.2026 | Commit `5647a06`, PR #1 |
| P03 | M1 (Teil 1): CI, Kern `@qualivis/core`, Golden G1 | ☑ | 08.11.2026 | Commits `5e54b41`–`1bd11f9` |
| P04 | M1 (Teil 2): Web-MVP, GitHub Pages | ☑ | 09.11.2026 | Commits `5ac8732`–`317cc37`, PR #2. Nach dem Merge: Pages-Workflow grün, Seite vom Nutzer geprüft, `origin/gh-pages` unverändert `5f0155e`. `pnpm dev` auf macOS bleibt offen (RI11) |
| P05-S01 | Regeln: Größe, Icons | ☑ | 09.11.2026 | `resolveThreshold`, `getNodeIcons`, `describeIconText`, `computeNodeVisual` in `packages/core/src/rules/`, 34 Tests; neue Korrektur ADR-011 A11 (feste Größe statt `NaN`) |
| P05-S02 | Regeln: Geometrie, Farben | ☑ | 09.11.2026 | `previewGeometry.ts`, `linkGeometry.ts` (Web nutzt `linkEnd`), `color.ts`; Vorschaukreise von `App` und Clusterfarben gleich dem Altsystem (`legacy-cluster-colors.json` neu erfasst) |
| P05-S03 | Regeln: Cluster, Constraints | ☑ | 09.11.2026 | `cluster.ts`, `reactConstraints.ts`; Cluster der KV `App` (`mini`) gleich dem Golden |
| P05-S04 | Golden G2 | ☑ | 09.11.2026 | `viewModel.ts` (`buildViewModel`), `rules.golden.test.ts`: AV und alle KVs von `mini` (4) und `realworld` (20) gleich dem Altsystem; `hasCluster` nach V3 korrigiert (A4). `ViewModelOptions` ohne `showCluster`: Clusterfarben wechseln ohne neues Layout (wie `updateGraph`), dafür `clusterPaint` im Kern |
| P05-S05 | Knoten-/Kanten-Rendering | ☑ | 09.11.2026 | `GraphNode`, `GraphLink`, `PreviewCircles`, `GraphDefs` (IDs per `useId`, Context), `graph.css` vollständig; `GraphView` baut das Ansichtsmodell per `useMemo` (keine Kopie mehr im Atom, `selectViewGraph` statt `buildViewGraph`). Zusätzlich `GraphCanvas.golden.test.tsx`: Markup aller Knoten gegen das DOM des Altsystems. Klick-Handler und `pointer-events` des Labels folgen mit der Auswahl (S09). Sichtvergleich mit dem Altsystem steht aus (Nutzer) |
| P05-S06 | WebCola-Adapter | ☑ | 09.11.2026 | `colaLayout.ts` (nur `webcola/dist/src/layout`, Animation per `requestAnimationFrame`), `createLayout.ts`, `GraphView` mit `settings`-Prop (bis P07) und Engine-Wechsel. Erstes Layout im nächsten Frame, damit der doppelte StrictMode-Effekt die Knoten nicht vorbelegt. G3 (`colaLayout.golden.test.ts`): Positionen aller 26 Ansichten bitgleich zum Altsystem (siehe Notizen). Bundle ohne `d3-selection` und d3 v1 |
| P05-S07 | Zoom & Pan | ☑ | 09.11.2026 | `zoomMath.ts`, `usePanZoom.ts` (Mausrad als nativer Listener mit `passive: false`, Verschieben, Einpassen in 250 ms per `requestAnimationFrame`), `GraphCanvas` mit Zoom-Gruppe statt `viewBox`. Einpassen nach dem ersten Layout-Ende jedes Laufs; V5 (Label-/Kantenbreite) gilt bis zum Neustart. Wie d3-zoom 1.x: kein Verschieben mit Strg oder anderer Maustaste, der Klick nach dem Verschieben wird verschluckt. Strg+Mausrad (Pinch) zoomt den Graphen (Abweichung, siehe Notizen). Auf Touchscreens zoomen zwei Finger wie bei d3-zoom 1.x (`gripTransform`), ein dritter wird ignoriert. Vorläufige Knöpfe „{n}%“ und „Zoom to fit“ bis S11. `geometry.ts` (`fitViewBox`) entfernt |
| P05-S08 | Knoten ziehen | ☑ | 09.11.2026 | `useNodeDrag.ts` wie d3-drag 1.x: Der Knoten behält den Abstand zum Zeiger, der Drag beginnt erst mit der ersten Bewegung, Shift beim Loslassen fixiert (Kraft-Layout). Der Zeiger wird wie bei d3 über `window` verfolgt statt per Pointer-Capture. `useLayout` liefert die laufende Engine und zählt Neustarts (`run`). Ziehen mit WebCola im Browser geprüft, Kraft-Layout per Test (Umschalten erst in P07) |
| P05-S09 | Auswahl, Ausblenden | ☑ | 09.11.2026 | Kern `connectivity.ts` (`connectedNodes`, `isLinkHighlighted`, `withoutNodes`), `useFade.ts` (Fokus gilt für einen Layout-Lauf, nicht während eines Drags), `selectionAtoms.ts` (Grundform). `GraphNode` mit `inlineStyle` und `events`, `GraphCanvas` mit `events` und `highlight`. Klick auf den Kreis wählt aus und blendet aus (G1), Strg+Klick entfernt Knoten samt Kanten nur aus der Ansicht, bleibt über Neustarts und startet das Layout von den bisherigen Positionen (G5), Strg+Überfahren (G6), Klick auf den Hintergrund (G7). Deckkraft per Inline-Style, Übergang per CSS (250 ms). Knoten nur mit der Maus wie im Altsystem; Tastatur folgt in P08-S07. Im Browser geprüft; Sichtvergleich mit dem Altsystem steht aus (Nutzer) |
| P05-S10 | Label-Kollision | ☑ | 09.11.2026 | `lib/isColliding.ts`, `lib/debounce.ts` (ohne `immediate`, mit `cancel`), `labelCollision.ts` (`hiddenLabels`), `useLabelCollision.ts`: misst die `tspan.label-text` in Dokumentreihenfolge, vorher alle eingeblendet, 250 ms entprellt; ein Neustart des Layouts zeigt alle Labels wieder bis zum nächsten Ende. Auslöser: jedes Layout-Ende (`useLayout` zählt `ends`, auch nach dem Ziehen) und jede Änderung der Zoomstufe. `GraphNode` mit `label` (`display: none` am Label, `<title>` am Knoten). Im Browser mit `realworld` geprüft (50 %: zwei Labels ausgeblendet, mit Tooltip) |
| P05-S11 | Legende, Aktionsleiste | ☑ | 09.11.2026 | UI-Bausteine `Button` (text, stroked, raised), `IconButton`, `Tooltip` (500 ms, unterhalb, `aria-describedby`, per Portal) und `Select` (Combobox mit Listbox, Tasten wie mat-select). `Legend` nach §15 mit den Defs-IDs des Graphen (`GraphCanvas` zeichnet sie als Kind neben dem SVG); Knotenklassen gelten für Graph und Legende. `GraphActions`: Zurück (KV mit `componentIdAtom`), „Toggle cluster“, Größenmetrik (Wechsel startet das Layout von den bisherigen Positionen neu, N11), Zoom, Vollbild (`fullScreenAtom`, danach „Zoom to fit“). Im Browser mit `realworld` geprüft (AV) |
| P05-S12 | M2-Abnahme | ◐ | 09.11.2026 | Doppelklick auf eine Komponente mit inneren Funktionen öffnet die KV (G3, vorläufig nur `componentIdAtom`). `pnpm check`, `pnpm test:parity`, `pnpm build` grün; Bundle ohne `d3-selection` und `d3-zoom`. Sichtvergleich `mini` bei 1280 × 800 (AV, KV `App`, „Toggle cluster“): gleich, auch Zoom und Clusterfarben. Freigabe von M2 durch den Nutzer steht aus |
| P05.5-S01 | Testprojekt `monorepo` | ☐ | | |
| P05.5-S02 | Upload: Konfiguration, Ordner überspringen | ☐ | | |
| P05.5-S03 | Kern: Pakete, tsconfig | ☐ | | |
| P05.5-S04 | Kern: Importe auflösen | ☐ | | |
| P05.5-S05 | Kern: erreichbare Dateien | ☐ | | |
| P05.5-S06 | Kern: umschreiben, analysieren | ☐ | | |
| P05.5-S07 | Upload: App-Ordner wählen | ☐ | | |
| P05.5-S08 | Abnahme am echten Monorepo | ☐ | | |
| P06-S01 | Split-Layout | ☐ | | |
| P06-S02 | Auswahlmodell | ☐ | | |
| P06-S03 | Dateibaum | ☐ | | |
| P06-S04 | Code-Quality-Panel, G4 | ☐ | | |
| P06-S05 | Quelltext (CodeMirror 6) | ☐ | | |
| P06-S06 | Drill-down, URL | ☐ | | |
| P06-S07 | M3-Abnahme | ☐ | | |
| P07-S01 | Settings-Atom | ☐ | | |
| P07-S02 | Einstellungsdialog | ☐ | | |
| P07-S03 | Wirkung der Einstellungen | ☐ | | |
| P07-S04 | Snackbar, Hinweise | ☐ | | |
| P07-S05 | Analyse-Persistenz, Drop | ☐ | | |
| P07-S06 | M4-Abnahme | ☐ | | |
| P08-S00…S09 | Härtung (vor Beginn verfeinern) | ☐ | | |
| P09-S00…S05 | E2E & Parität (vor Beginn verfeinern) | ☐ | | |
| P10-S00…S03 | Kern-Paket & CLI (vor Beginn verfeinern) | ☐ | | |
| P11-S00…S02 | Abschluss (vor Beginn verfeinern) | ☐ | | |

## Abweichungen und Notizen

Hier jede Abweichung vom Plan mit Begründung und Verweis (ADR bzw. Nutzerentscheidung) eintragen,
solange sie für kommende Schritte wichtig ist. Vor dem PR der Phase wandert sie in die betroffenen
Karten oder Grundlagen oder wird gestrichen; Erledigtes steht in der Git-Historie.

- **Positionen in den Goldens (P05-S06, wichtig für S12 und P09):** `x`/`y` in
  `legacy-dom-*.json` sind die Positionen direkt nach dem synchronen `start(40, 20, 20)`, vor dem
  ersten Animations-Tick; bei der Erfassung lief keine Animation. Das fertig animierte Layout weicht
  bei größeren Graphen davon ab (AV `realworld` bis 115 px), ist aber derselbe Algorithmus.
- **Neustart des Layouts (P05-S06, betrifft S11 und P07):** Wechsel der Engine startet wie im
  Altsystem von den bisherigen Positionen. Wechsel von Größenmetrik oder „Node sizes based on
  metrics“ baut ein neues Ansichtsmodell und startet das Layout neu von vorn; das Altsystem rechnete
  dort von den alten Positionen weiter (ADR-003: Positionen dürfen abweichen).
- **Ziehen meldet `dragging` in beiden Layouts (P05-S08, betrifft S09):** Das Altsystem setzte
  `dragging` nur im Kraft-Layout; beim Ziehen mit WebCola konnte es also ausblenden. Den Klick nach
  Ziehen oder Verschieben verschluckt schon `suppressNextClick` (wie d3); S09 braucht dafür nichts
  Eigenes.
- **Pinch und Strg+Mausrad zoomen den Graphen (P05-S07, Nutzerentscheidung 09.11.2026):** Browser
  melden einen Pinch auf dem Touchpad als Mausrad mit Strg. d3-zoom 1.x ließ das dem Browser, der
  dann die ganze Seite samt Kopfzeile zoomte (höchstens bis zu seiner eigenen Grenze). Jetzt wie in
  d3-zoom 3: Der Graph zoomt um den Zeiger, Strg zählt zehnfach (ein Strg-Mausrad-Schritt der Maus
  zoomt vierfach). Strg+Klick (Knoten entfernen) und Strg beim Überfahren (Ausblenden) bleiben frei
  für S09.
- **Label nicht klickbar (P05-S09, betrifft S12 und P09):** Karte S09 und Inventar G1 nennen
  „Klick auf Kreis oder Label“. Im Altsystem hat `.node-label` aber `pointer-events: none`, der
  Klick-Handler an `tspan.label-text` griff also nie; ein Klick auf das Label trifft den Kreis
  darunter oder den Hintergrund. Neu genauso, ohne Handler am Label.
- **Helle Füllung nur beim aktuellen Fokus (P05-S09):** Das Altsystem färbte indirekt verbundene
  Knoten `#fafafa` und setzte die Füllung beim Einblenden nicht zurück (d3 `style('fill', false)`
  ändert nichts). Nach Strg+Überfahren blieben Knoten also hell, bis zur nächsten Auswahl oder
  zum Neustart. Neu sind genau die indirekten Knoten des aktuellen Fokus hell.
- **Auswahl-Grundform (P05-S09, betrifft P06-S02):** `SelectedNode` sind die Felder `id`, `label`,
  `type`, `report`, `icons` des Ansichtsmodells; die Icons sind also `VisualIcon` (Beschreibung als
  Objekt) statt `NodeIcon` (HTML-Text). `selectGraphNodeAtom` nimmt noch keine `componentId`, die
  braucht erst P06-S02 für Code und Zeilen.
- **Tooltip nur am ausgeblendeten Label (P05-S10):** Das Altsystem entfernte bei jeder Messung den
  ersten `<title>` im Knoten. Bei Knoten mit Vorschaukreisen (App-Ansicht) war das der Tooltip eines
  Vorschaukreises, der so nach und nach verloren ging, während der Label-Tooltip blieb, auch wenn
  das Label wieder zu sehen war. Neu hat ein Knoten genau dann einen Tooltip, wenn sein Label
  ausgeblendet ist; die Tooltips der Vorschaukreise bleiben.
- **Aktionsleiste (P05-S11):** Die Auswahl der Größenmetrik richtet sich nach der Ansicht, nicht
  nach der Komponenten-ID. Bei einer Analyse mit nur einer Komponente bot das Altsystem in deren
  Komponentenansicht auch „Lines of JSX Code“ und „Maximum JSX nesting“ an; neu fehlen sie dort, und
  eine gewählte wird wie beim Wechsel in die Komponentenansicht auf „Lines of Code“ zurückgesetzt.
  Der Tooltip verschwindet beim Klicken auf sein Element (matTooltip blieb stehen und lag dann über
  der geöffneten Liste). Die Liste der Auswahl öffnet unter dem Feld (mat-select legte die gewählte
  Option über den Wert); Klickwellen (Ripple) der Material-Buttons fehlen.
