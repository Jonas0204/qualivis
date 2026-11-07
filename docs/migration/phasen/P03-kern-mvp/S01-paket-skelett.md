# P03-S01 – Paket-Skelett, Modelltypen und Konstanten

Meilenstein M1 · Abhängig von: P02 abgeschlossen · Umfang M

## Ziel
`packages/core` existiert mit Konfiguration, Abhängigkeiten, Modelltypen und Konstanten (1:1 aus dem
Altsystem). Die Patches werden bei der Installation angewendet.

## Kontext
- `00-grundlagen/03-architektur.md` §2 (Ordner), §3 (Abhängigkeitsregeln)
- `01-referenz-altsystem/02-analyse-kern.md` §2 (Dateiliste), §4 (Datenstrukturen)
- Altcode: `legacy/angular/src/app/interfaces.ts`, `types.ts`, `constants/*.ts`

## Dateien
```
packages/core/package.json
packages/core/tsconfig.json          (src, ohne DOM, ohne Node)
packages/core/tsconfig.test.json     (src + test, mit Node-Typen)
packages/core/vitest.config.ts
packages/core/src/index.ts           (vorerst nur Modell-Exporte)
packages/core/src/types/globals.d.ts
packages/core/src/types/escomplex.d.ts
packages/core/src/types/path-browserify.d.ts
packages/core/src/model/graph.ts             ← interfaces.ts (Node, Link, RefLink, Graph, NodeIcon, NodeSelection, Selection)
                                               alle als `type` (Konvention), Felder unverändert
packages/core/src/model/types.ts             ← types.ts (NodeType, NodeKind)
packages/core/src/model/fileMap.ts           ← interfaces.ts (FileMap, ComponentMap, Component, Import, AstWithPath, FileTree, FlatNode)
packages/core/src/model/settings.ts          ← interfaces.ts (Settings) + defaultSettings (aus settings.service.ts:9-19)
packages/core/src/model/qualityMetrics.ts    ← constants/quality-metrics.ts (inkl. QualityMetrics-Typ)
packages/core/src/model/specialMethods.ts    ← constants/special-methods.ts
packages/core/src/model/files.ts             ← constants/files.ts + type FileWithPath = { path: string }
packages/core/src/model/graphSettings.ts     ← constants/graph-settings.ts
packages/core/src/model/clusterColors.ts     ← constants/cluster-colors.ts (nur clusterColors; d3SchemeCategory10 ungenutzt → weglassen)
packages/core/src/model/report.ts            (grober Report-Typ, siehe unten)
packages/core/src/model/model.test.ts
```

## Schritte
1. `packages/core/package.json`:
   ```json
   {
     "name": "@qualivis/core",
     "version": "0.0.0",
     "private": true,
     "type": "module",
     "sideEffects": false,
     "exports": { ".": "./src/index.ts" },
     "scripts": {
       "typecheck": "tsc -p tsconfig.json && tsc -p tsconfig.test.json",
       "test": "vitest run"
     },
     "dependencies": {
       "@babel/parser": "catalog:",
       "@babel/traverse": "catalog:",
       "@babel/types": "catalog:",
       "jlouvain": "catalog:",
       "path-browserify": "catalog:",
       "typhonjs-escomplex-project": "catalog:"
     },
     "devDependencies": {
       "@types/babel__traverse": "catalog:",
       "@types/node": "catalog:",
       "typescript": "catalog:",
       "vitest": "catalog:"
     }
   }
   ```
   `RefLink`/`Node` erweitern im Altsystem `SimulationNodeDatum` aus `d3-force`. Im Kern wird dafür
   in `model/graph.ts` ein lokaler Typ definiert (kein `@types/d3-force` im Kern):
   ```ts
   /** Same shape as d3-force's SimulationNodeDatum (kept local to stay dependency-free). */
   export type SimulationNodeDatum = {
     index?: number; x?: number; y?: number; vx?: number; vy?: number;
     fx?: number | null; fy?: number | null;
   };
   // Legacy `interface Node extends SimulationNodeDatum { … }` becomes:
   export type Node = SimulationNodeDatum & { id: string; label?: string; /* … unchanged fields */ };
   ```
2. `tsconfig.json`:
   ```json
   {
     "extends": "../../tsconfig.base.json",
     "compilerOptions": { "noImplicitAny": false, "noUncheckedIndexedAccess": false, "lib": ["es2023"], "types": [] },
     "include": ["src"],
     "exclude": ["src/**/*.test.ts"]
   }
   ```
   `tsconfig.test.json`: `extends ./tsconfig.json`, `compilerOptions.types: ["node"]`,
   `include: ["src", "test"]`, kein `exclude`.
3. `vitest.config.ts`:
   ```ts
   import { defineProject } from 'vitest/config';

   export default defineProject({
     test: { name: 'core', environment: 'node', include: ['src/**/*.test.ts', 'test/**/*.test.ts'] },
   });
   ```
   Im Root-`vitest.config.ts` `'packages/core'` zu `projects` hinzufügen.
4. `src/types/globals.d.ts`:
   ```ts
   // The core runs without DOM/Node libs. Only these host globals are used:
   // console.* (legacy logging) and setTimeout (yielding in analyzeProjectAsync).
   declare const console: {
     error(...data: unknown[]): void;
     warn(...data: unknown[]): void;
     log(...data: unknown[]): void;
   };
   declare function setTimeout(handler: () => void, timeout?: number): unknown;
   ```
   `src/types/escomplex.d.ts` und `src/types/path-browserify.d.ts`: aus `anhang/A4`.
5. Modell-Dateien: Inhalte **wörtlich** aus dem Altcode übernehmen (Feldnamen, Optionalität,
   Kommentare). Anpassen nur: benannte Exports, Importe zwischen den Modell-Dateien und
   `interface X { … }` → `type X = { … }` (Erweiterung `extends` → `&`; reine Typänderung).
   `qualityMetrics.ts` inkl. der auskommentierten Metriken (sie dokumentieren bewusst Weggelassenes).
6. `model/report.ts` (bewusst grob bis P08-S01):
   ```ts
   /** Subset of a typhonjs-escomplex method/class/module report used by the app. */
   export type MetricReport = {
     cyclomatic: number;
     paramCount: number;
     sloc: { physical: number; logical: number; jsx?: number };
     halstead: { difficulty: number; bugs: number; [key: string]: unknown };
     maxJsxNesting?: number;
     lineStart?: number;
     lineEnd?: number;
     name?: string;
     aggregate?: MetricReport;
     [key: string]: unknown;
   };
   /** Full escomplex project report (only `modules` is used by the app). */
   export type EscomplexReport = {
     modules: Array<{ srcPath: string; methods: MetricReport[]; classes: Array<MetricReport & { name: string; methods: MetricReport[] }>; [key: string]: unknown }>;
     [key: string]: unknown;
   };
   ```
7. `src/index.ts`: Modell-Typen und Konstanten exportieren (`export * from './model/…'`; Typen mit
   `export type`).
8. `model/model.test.ts` – Verhaltenstests der Konstanten, die später Regeln steuern:
   - `qualityMetrics` hat genau die Schlüssel `sloc.physical, sloc.jsx, maxJsxNesting, cyclomatic,
     halstead.difficulty, halstead.bugs, paramCount` **in dieser Reihenfolge** (Reihenfolge steuert
     Icons und Panel).
   - `warningThreshold === 0.8`, `sizeConstant === 16000`.
   - `reactMethods[0] === 'constructor'`, letztes Element `'render'`, Länge 16.
   - `defaultSettings` entspricht der Tabelle im Funktionsinventar §7 (+ `text: true`, `fullScreen: false`).
9. Nutzer bitten: `pnpm install` (neue Abhängigkeiten). Danach in der Ausgabe prüfen, dass beide
   Patches angewendet wurden (`pnpm-lock.yaml` → Abschnitt `patchedDependencies` mit 2 Hashes).

## Akzeptanzkriterien
- [ ] `pnpm --filter @qualivis/core typecheck` grün.
- [ ] Modell-Tests grün; `pnpm check` grün.
- [ ] `pnpm-lock.yaml` enthält `patchedDependencies` mit beiden Paketen.
- [ ] In `node_modules/.pnpm/typhonjs-escomplex-commons@*/…/dist/utils/ast/astSyntax.js` stehen die
      Guards `typeof this[node.right.type] === 'function'`.

## Prüfen
`pnpm check`

## Fallstricke
- `strictDepBuilds` meldet `core-js` → ist in `allowBuilds: core-js: false` erfasst. Andere Meldung:
  stoppen und Nutzer fragen.
- Ein nicht anwendbarer Patch bricht die Installation ab (pnpm ≥ 11): Pfade im Patch prüfen
  (`a/dist/...`).

## Nicht tun
- Keine Felder umbenennen, keine Konstanten „aufräumen“.

## Commit-Vorschlag
`feat(core): add package skeleton, model types and constants`
