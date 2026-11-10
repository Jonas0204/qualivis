# Zielarchitektur

## 1. Überblick

```
┌──────────────────────────── apps/web (@qualivis/web) ────────────────────────────┐
│ React 19 · Vite 8                                                                 │
│  features/upload ─┐                                                               │
│  features/graph ──┼─► state/ (Jotai-Atome)                   ◄── lib/ (storage, …) │
│  features/file-tree, code-quality, source-code, settings                          │
│  ui/ (Button, Dialog, SlideToggle, Select, Snackbar, SplitPane, Tooltip, Icon)    │
│  features/graph/layout (WebCola-Adapter, d3-force) – framework-frei, nur DOM-frei │
└──────────────────────────────────┬────────────────────────────────────────────────┘
                                   │ importiert nur die öffentliche API
┌──────────────────────── packages/core (@qualivis/core) ──────────────────────────┐
│ TypeScript, kein DOM, kein React · läuft in Node und Browser                      │
│  analysis/  analyzeProject(), escomplex-Adapter (path-browserify), interop        │
│  legacy/    1:1 übernommene Analysehelfer (traverse*, findReport, …)              │
│  rules/     Darstellungsregeln als reine Funktionen (Größe, Icons, Cluster, …)    │
│  model/     Typen und Konstanten (Metriken, Schwellenwerte, Farben)               │
└──────────────────────────────────┬────────────────────────────────────────────────┘
                                   │ (ab M7)
┌──────────────────────── packages/cli (@qualivis/cli) ────────────────────────────┐
│ Node · liest Ordner von der Platte, ruft core auf, gibt Text/JSON aus, Exit-Codes │
└───────────────────────────────────────────────────────────────────────────────────┘
e2e/ (@qualivis/e2e, Playwright, separat installierbar) · tools/ (Node-Skripte ohne Abhängigkeiten)
```

## 2. Repository-Struktur (Ziel nach M4)

```
/
├─ package.json              privat; Skripte; packageManager pnpm@12.16.1; engines node >=24
├─ pnpm-workspace.yaml       Pakete, Catalog, Lieferketten-Härtung, patchedDependencies
├─ pnpm-lock.yaml
├─ biome.json                Lint + Format (ein Werkzeug)
├─ tsconfig.base.json        gemeinsame Compiler-Optionen
├─ vitest.config.ts          test.projects: packages/*, apps/*
├─ .editorconfig  .gitattributes  .gitignore  .node-version
├─ patches/                  pnpm-Patches (escomplex-commons, plugin-manager)
├─ packages/
│  ├─ core/
│  │  ├─ package.json  vitest.config.ts  README.md
│  │  ├─ tsconfig.json            nur Verweise auf tsconfig.src.json (src ohne Tests, ohne Node/DOM;
│  │  │                           `composite`, schreibt nur `.d.ts` nach `dist/types`) und
│  │  │                           tsconfig.test.json (Tests, mit Node-Typen)
│  │  ├─ src/
│  │  │  ├─ index.ts                 öffentliche API (nur hier wird exportiert)
│  │  │  ├─ analysis/                analyzeProject.ts, escomplex.ts (mit path-browserify), interop.ts,
│  │  │  │                           sortFiles.ts, hasSingleComponent.ts
│  │  │  ├─ legacy/                  parser.ts, traverse*.ts, findReport.ts, generateAppGraph.ts,
│  │  │  │                           extractFileTree.ts, isComponentFile.ts, nestedStringAccess.ts
│  │  │  ├─ rules/                   nodeVisuals.ts, icons.ts, cluster.ts, reactConstraints.ts,
│  │  │  │                           previewGeometry.ts, linkGeometry.ts, color.ts, thresholds.ts,
│  │  │  │                           connectivity.ts, viewModel.ts
│  │  │  ├─ workspace/               (P05.5, ADR-019) projectFiles.ts, jsonc.ts, packages.ts,
│  │  │  │                           tsconfig.ts, resolveImport.ts, scanImports.ts, selectFiles.ts,
│  │  │  │                           rewriteImports.ts, analyzeWorkspace.ts, appCandidates.ts
│  │  │  ├─ model/                   graph.ts, report.ts, settings.ts, qualityMetrics.ts,
│  │  │  │                           specialMethods.ts, files.ts, graphSettings.ts, clusterColors.ts
│  │  │  └─ types/                   globals.d.ts, escomplex.d.ts, path-browserify.d.ts
│  │  └─ test/golden/                analysis.golden.test.ts, rules.golden.test.ts
│  └─ cli/                           (ab P10)
├─ apps/
│  └─ web/
│     ├─ index.html  vite.config.ts  vitest.config.ts
│     ├─ tsconfig.json               Verweis auf core/tsconfig.src.json; `typecheck` ist `tsc -b`,
│     │                              damit der Kern mit seinen eigenen Optionen geprüft wird
│     ├─ public/favicon.png
│     └─ src/
│        ├─ main.tsx                 Einstieg, Provider
│        ├─ app/                     App.tsx, AppShell.tsx, Toolbar.tsx, useUrlState.ts
│        ├─ state/                   analysisAtoms.ts, viewAtoms.ts, selectionAtoms.ts,
│        │                           settingsAtoms.ts, snackbarAtoms.ts, selection.ts, StateProvider.tsx
│        ├─ features/
│        │  ├─ upload/               UploadView.tsx, ProjectChoice.tsx, readDroppedFiles.ts, useFileDrop.ts, DropOverlay.tsx
│        │  ├─ analysis/             runAnalysis.ts (später worker/)
│        │  ├─ graph/                GraphView.tsx, GraphCanvas.tsx, GraphNode.tsx, GraphLink.tsx,
│        │  │                        PreviewCircles.tsx, GraphDefs.tsx, graphDefsContext.ts,
│        │  │                        Legend.tsx, GraphActions.tsx, usePanZoom.ts, zoomMath.ts,
│        │  │                        useNodeDrag.ts, pointerGesture.ts, useFade.ts,
│        │  │                        useLabelCollision.ts, labelCollision.ts, useElementSize.ts,
│        │  │                        selectViewGraph.ts, useLayout.ts, graph.css,
│        │  │                        layout/ (types.ts, createLayout.ts, colaLayout.ts, forceLayout.ts)
│        │  ├─ file-tree/            FileTree.tsx, useTreeState.ts
│        │  ├─ code-quality/         CodeQualityPanel.tsx, QualityMetricBar.tsx, IconDescription.tsx
│        │  ├─ source-code/          SourceCodeView.tsx, neoTheme.ts
│        │  └─ settings/             SettingsDialog.tsx
│        ├─ ui/                      Button.tsx, IconButton.tsx, Icon.tsx, Dialog.tsx, SlideToggle.tsx,
│        │                           Select.tsx, Snackbar.tsx, SplitPane.tsx, Tooltip.tsx, ProgressBar.tsx
│        ├─ lib/                     storage.ts, onceFlags.ts, debounce.ts, isColliding.ts
│        └─ styles/                  tokens.css, global.css, fonts.css
├─ e2e/                              (ab P09)
├─ tools/
│  ├─ legacy/                        extract-legacy-build.mjs, serve-legacy.mjs, capture.browser.js,
│  │                                 capture-cluster-colors.browser.js
│  └─ golden/                        diff-json.mjs
├─ testdata/
│  ├─ README.md
│  ├─ fixtures/{mini,realworld,monorepo}/   monorepo ohne Goldens (P05.5)
│  └─ golden/{mini,realworld}/
├─ legacy/angular/                   altes Projekt (nur Referenz, wird nicht gebaut)
└─ docs/
   ├─ migration/                     dieser Plan
   └─ (später) architecture.md
```

## 3. Abhängigkeitsregeln

1. `packages/core` importiert **nie** aus `apps/*`, nie React, nie DOM-APIs (`window`,
   `document`, `localStorage`). Die TS-Konfiguration von `core` hat `lib: ["es2023"]` **ohne** `dom`
   → Verstöße sind Typfehler. (Ausnahme: `File`-Typ wird nicht gebraucht; Eingabe ist
   `{ path: string; code: string }`.)
2. `apps/web` importiert aus `core` **nur** über `@qualivis/core` (Paket-Einstieg), nie über
   tiefe Pfade wie `@qualivis/core/src/legacy/...`.
3. Innerhalb von `apps/web`: `ui/` kennt keine Fachbegriffe (keine Imports aus `features/` oder
   `state/`), damit die Bausteine wiederverwendbar bleiben. Features dürfen andere Features nutzen,
   wenn ein größeres Feature ein kleineres braucht (wie eine Komponente eine andere) – aber **ohne
   Zyklen** (A importiert B und B importiert A ist verboten). Was mehrere Features ohne fachliche
   Zuordnung brauchen, gehört nach `lib/` oder `ui/`. (Die Bachelorarbeit fordert keine strengere
   Trennung; Ziel ist Modularität ohne Übertreibung.)
4. `features/graph/layout/` ist frei von React (reine Klassen/Funktionen + DOM-freie Mathematik),
   damit es testbar ist und später in einen Worker könnte.
5. Regel 1 und 2 erzwingen TypeScript und pnpm: `core` hat `lib` ohne `dom` und kein React als
   Abhängigkeit (pnpm legt nur deklarierte Pakete in `node_modules`), und `exports` in
   `packages/core/package.json` gibt nur den Paket-Einstieg frei – tiefe Importe lösen nicht auf.

## 4. Datenfluss

```
Upload/Drop ─► readDroppedFiles() ─► ProjectFiles {sources, configs} (ab P05.5)
          ─► ab 2 Paketen: Auswahl des App-Ordners (P05.5, ADR-019)
          ─► runAnalysis() ─► core.analyzeProjectAsync(sources, {onProgress})
                             bzw. core.analyzeWorkspaceAsync(project, {appDir}, {onProgress})
          ─► analysisAtom = { status, progress, result, error }
GraphView ─► viewGraphAtom (abgeleitet aus analysisAtom + componentIdAtom) ─► Graph der Ansicht + view
          ─► core.buildViewModel(graph, {view, sizeMetric, …}) ─► VisualNode[] (Größen, Icons, Cluster, …)
          ─► layout.start(VisualNode[], links, size, constraints) ─► Positionen (Tick-Ereignisse)
          ─► <GraphCanvas> rendert SVG; Interaktionen ─► selectionAtom / componentIdAtom
Panels    ─► lesen selectionAtom + analysisAtom
Settings  ─► settingsAtom (persistiert) ─► GraphView startet Layout neu
```

## 5. Zustand (State) mit Jotai (ADR-013)

- Geteilter Zustand liegt in **Jotai-Atomen** (`jotai` 3.0.1, keine Abhängigkeiten). Ein Atom ist
  ein kleiner, typisierter Zustandsbaustein; Komponenten lesen/schreiben ihn mit `useAtomValue` /
  `useSetAtom` / `useAtom`. Abgeleiteter Zustand ist ein Atom mit `get`-Funktion – das hält
  Berechnungen aus den Komponenten heraus.
- Atome (je Datei in `state/`):
  - `analysisAtom` – `{ status: 'idle' | 'running' | 'done' | 'error'; progress?; result?; error? }`
  - `viewModeAtom` (`'upload' | 'graph'`), `componentIdAtom` (`string | undefined`, synchron mit URL)
  - `viewGraphAtom` – abgeleitet: Graph der aktuellen Ansicht (AV/KV) aus Analyse + `componentIdAtom`,
    keine Kopie. Das Ansichtsmodell (`buildViewModel`, eine Kopie) baut `GraphView` per `useMemo`,
    weil das Layout Positionen in Knoten und Kanten schreibt; der Wert eines Atoms bliebe sonst
    nicht unverändert.
  - `selectionAtom` – `NodeSelection[] | null` (wie im Altsystem)
  - `settingsAtom` – `atomWithStorage('qualivis.settings', defaultSettings, validierender Storage)`
  - `snackbarAtom` – aktuelle Meldung
- `StateProvider` stellt einen Jotai-`Provider` mit eigenem `store` bereit. Komponenten- und
  Hook-Tests rendern über den `TestProvider` (eigener Store, Startwerte per `useHydrateAtoms`,
  `06-teststrategie.md` §2); reine Atom-Tests nutzen `createStore()` + `store.set(...)`
  → keine globalen Singletons im Test.
- Aktionen mit mehreren Schritten (z. B. Analyse starten) sind normale Funktionen, die den `store`
  bekommen (`runAnalysis(files, store)`), oder Schreib-Atome – beides testbar ohne React.
- Graph-Laufzeitzustand (Positionen, Zoom, Ausblenden) lebt **lokal** in `GraphView`
  (Refs/State), nicht in Atomen.

## 6. Graph-Rendering

- React rendert die SVG-Struktur deklarativ: `<svg>` → `<defs>` (Pfeil, Schraffur) → `<g transform>`
  (Zoom) → Kanten → Knoten. Klassen und Struktur wie im Altsystem (`circle-node`, `circle-overlay`,
  `inner-circle`, `function`, `dots`, `node-label`, `label-text`, `icon`) – das hält CSS und
  Paritätstests einfach.
- Layout läuft **außerhalb** von React: Engine-Objekte (`ColaLayout`, `ForceLayout`) mutieren
  `x/y` der Knoten und melden Ticks. `useLayout` zählt Ticks in einem State, der höchstens einmal
  pro Animation-Frame erhöht wird → React rendert neu. Ziel ≤ 16 ms pro Frame bei 300 Knoten
  (P08-S09 prüft; Fallback: Positionen per Ref direkt setzen).
- Layout-Schnittstelle (`features/graph/layout/types.ts`):

```ts
export type LayoutNode = {
  id: string; width: number; height: number;
  x?: number; y?: number; fx?: number | null; fy?: number | null; index?: number;
};
export type LayoutLink = { source: LayoutNode; target: LayoutNode; inherits?: boolean };
export type LayoutEngine = {
  start(): void;                                  // startet/animiert
  stop(): void;                                   // hält an, gibt Ressourcen frei
  onTick(listener: () => void): () => void;       // Abmelde-Funktion
  onEnd(listener: () => void): () => void;
  dragStart(node: LayoutNode): void;
  drag(node: LayoutNode, position: { x: number; y: number }): void;
  dragEnd(node: LayoutNode, options: { pin: boolean }): void;
};
```

- Zoom/Pan: eigener Hook `usePanZoom` (Wheel, Pointer, Übergänge, `zoomToFit`). Keine
  d3-zoom-Abhängigkeit.
- Farben im Graph über CSS-Klassen und `tokens.css`; Clusterfarben per Inline-Style (aus
  `core/rules/color.ts`).

## 7. URL und Navigation

- Kein Router-Paket. `useUrlState` liest/schreibt `?id=` per `history.pushState`/`popstate`.
  `view` = `upload` ohne Analyse, sonst `graph`. Zurück-Button des Browsers funktioniert.
- Basis-Pfad: Vite `base: './'` → läuft unter beliebigem Unterpfad, z. B. auf GitHub Pages unter
  `/qualivis/` (`.github/workflows/pages.yml`). Der Pfad ändert sich nie (nur `?id=`), deshalb
  braucht Pages keinen 404-Fallback.
- Deep-Link `?id=` funktioniert auch nach Neuladen (Korrektur von N4, ADR-011), sofern die
  Analyse aus dem Speicher wiederhergestellt werden kann.

## 8. Persistenz

Schlüssel mit Präfix `qualivis.`: `settings` (über Jotai `atomWithStorage` mit validierendem
Storage), `analysis` (FileMap + App-Graph + Report, explizit gespeichert über `lib/storage.ts`),
`once.<hinweis>`. `lib/storage.ts` kapselt `localStorage` mit `try/catch` (Quota, Privatmodus).
Die Analyse wird nach jeder Analyse und beim Verlassen (`pagehide`) gespeichert; Fehler beim
Speichern werden einmal als Snackbar gemeldet, nie als Absturz.

## 9. Styling

- Design-Tokens als CSS-Custom-Properties in `styles/tokens.css` (Werte aus der Stil-Referenz).
- UI-Bausteine und Panels: **CSS Modules** (`*.module.css`, in Vite eingebaut) → keine globalen
  Kollisionen.
- Graph: eine globale Datei `features/graph/graph.css`, alle Regeln unter `.qv-graph` geschachtelt,
  Klassennamen wie im Altsystem.
- Schriften lokal über `@fontsource/roboto` (300/400/500) und `@fontsource/material-icons`.

## 10. Fehlerbehandlung

- Kern: wirft wie das Altsystem (z. B. Syntaxfehler beim Parsen) und loggt dabei den Pfad der
  Datei (`Parsing failed:`). Ab P08-S05 zusätzlich
  `analyzeProject` mit `onFileError`-Option (Datei überspringen statt Abbruch) – Standard bleibt
  das alte Verhalten, damit Goldens stabil bleiben.
- Web: `runAnalysis` fängt alle Fehler und setzt `analysisAtom` auf `status: 'error'` mit Meldung;
  die UI zeigt eine Snackbar und bleibt bedienbar. Eine React-Error-Boundary um `GraphView`
  verhindert weiße Seiten.
- Keine `console.log` im Produktivcode. Debug-Ausgaben nur über `lib/debug.ts`, die mit
  `localStorage['qualivis.debug'] = '1'` eingeschaltet wird.
