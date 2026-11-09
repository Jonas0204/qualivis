# Analyse-Kern des Altsystems

Der Analyse-Kern wird **1:1 übernommen** (ADR-002). Dieses Dokument beschreibt, was er tut, wo
er liegt und welche Eigenheiten erhalten bleiben müssen. Abnahme ist der Golden-Test G1
(`00-grundlagen/06-teststrategie.md`), der im Spike für zwei Testprojekte **0 Abweichungen**
ergab.

## 1. Pipeline (aus `services/data.service.ts:28-91`)

```
Dateien (path, File)                              path beginnt mit '/', z. B. '/mini/src/App.js'
  └─ filter(isComponentFile)                       helper/isComponentFile.ts
  └─ für jede Datei: code = await file.text()
       ast = parse(code, path)                     helper/parser.ts  (@babel/parser, Plugin-Liste)
       fileMap[path] = { code }
  └─ report = escomplexProject.analyze(asts)       typhonjs-escomplex-project 0.1.0 (+2 Patches)
  └─ für jede Datei: { components, defaultExport } = traverse(asts, path, report)
       helper/traverse.ts → traverseClassComponent.ts / traverseFunctionComponent.ts
       (schreibt report.sloc.jsx und report.maxJsxNesting in den escomplex-Report!)
  └─ fileMap filtern (Komponenten vorhanden ODER defaultExport beginnt mit '/')
  └─ für jede Komponente mit graph: node.report = findReport(report, fileMap, file, comp, node.id)
  └─ falls NICHT genau eine Datei mit genau einer Komponente:
       appGraph = generateAppGraph(fileMap, componentFiles, report)
```

Die Funktion `analyzeProject()` in `packages/core` bildet genau diese Schritte nach, ohne RxJS und
Angular; `analyzeProjectAsync()` meldet zusätzlich den Fortschritt (50 % / 50 %, `onProgress`).

## 2. Dateien des Kerns (werden kopiert)

| Datei (alt) | Zweck | Ziel (neu) |
|---|---|---|
| `helper/parser.ts` | Babel-Parser mit fester Plugin-Liste; `typescript` bei `.ts/.tsx`, sonst `flow` | `packages/core/src/legacy/parser.ts` |
| `helper/traverse.ts` | Komponenten pro Datei finden (Klasse, Funktion, Arrow, `connect()`), Default-Export auflösen | `.../legacy/traverse.ts` |
| `helper/traverseClassComponent.ts` | Graph einer Klassenkomponente: Methoden, Klassen-Properties, Aliase (`bind`, Pipe-Arrow), `this.x`-Kanten, Konstruktor-Funktionen, JSX-Zeilen/-Tiefe | `.../legacy/traverseClassComponent.ts` |
| `helper/traverseFunctionComponent.ts` | Graph einer Funktionskomponente: innere Funktionen (Variablen-Deklaratoren, `useCallback`), Kanten über Bindings, JSX-Zeilen/-Tiefe | `.../legacy/traverseFunctionComponent.ts` |
| `helper/traverseHelper.ts` | Hilfsfunktionen (Imports auflösen, Komponentenerkennung, `isReturningJSX`, JSX-Tiefe, Kanten/Knoten hinzufügen, Nachbearbeitung) | `.../legacy/traverseHelper.ts` |
| `helper/findReport.ts` | escomplex-Teilreport zu Komponente/Funktion finden | `.../legacy/findReport.ts` |
| `helper/generateAppGraph.ts` | App-Graph (Komposition + Vererbung), Vorschau-Sortierung | `.../legacy/generateAppGraph.ts` |
| `helper/extractFileTree.ts` | Dateibaum für das linke Panel | `.../legacy/extractFileTree.ts` |
| `helper/isComponentFile.ts` | Dateifilter | `.../legacy/isComponentFile.ts` |
| `helper/nestedStringAccess.ts` | `'halstead.difficulty'` → `report.halstead.difficulty` | `.../legacy/nestedStringAccess.ts` |
| `helper/generateLinkReferences.ts` | Kanten-IDs → Knotenobjekte (für Layout) | `apps/web/...` (UI) |
| `interfaces.ts`, `types.ts` | Datentypen | `packages/core/src/model/` |
| `constants/quality-metrics.ts` | Metriken, Schwellenwerte, `warningThreshold = 0.8`, `sizeConstant = 16000` | `packages/core/src/model/qualityMetrics.ts` |
| `constants/special-methods.ts` | React-Lifecycle-Methoden (Reihenfolge = x-Achse), veraltete Methoden | `packages/core/src/model/specialMethods.ts` |
| `constants/files.ts` | Endungen, ausgeschlossene Ordner | `packages/core/src/model/files.ts` |
| `constants/graph-settings.ts` | Darstellungskonstanten (für Regeln) | `packages/core/src/model/graphSettings.ts` |
| `constants/cluster-colors.ts` | 20 Clusterfarben | `packages/core/src/model/clusterColors.ts` |

Nicht übernommen: `helper/getFilesAsync.ts` (wird in der Web-App als `readDroppedFiles`
portiert), `helper/cookie.ts`, `helper/debounce.ts`, `helper/looksLike.ts` (ungenutzt),
`helper/isColliding.ts` (Web-App), `constants/data.ts` (Demo-Daten, ADR-011).

## 3. Anpassungen gegenüber dem Altcode

Im Kern umgesetzt (Details: `packages/core/src/legacy/README.md` und der Code): Typimport
`NodePath` aus `@babel/traverse`, CJS-Interop über `cjsDefault()`, escomplex mit
`path-browserify` (ADR-005), Typisierung nur mit `!`, Casts und Annotationen, DOM-freier Typ
`FileWithPath`. Für die Web-App gilt zusätzlich:

1. Der Patch für `typhonjs-plugin-manager` lässt `require('path')` am Dateianfang stehen. Vite
   meldet „Module "path" has been externalized“; das ist harmlos, wird aber per Vite-Alias
   `path` → `path-browserify` unterdrückt (`apps/web/vite.config.ts`).
2. Das Hilfskonstrukt `Buffer = { isBuffer: false }` aus der alten `index.html` ist **nicht** nötig
   (`jsesc` 3.1 prüft `typeof Buffer`).

## 4. Datenstrukturen

```ts
// model/types.ts
type NodeType = 'component' | 'innerFunction';
type NodeKind = 'FunctionComponent' | 'ClassComponent';

// model/graph.ts, model/fileMap.ts (Auszug). Felder unverändert aus legacy interfaces.ts übernehmen,
// aber als `type` geschrieben (Konvention); `Node` erweitert SimulationNodeDatum per `&`.
type Node = SimulationNodeDatum & {   // Knoten in Komponenten- und App-Graph
  id: string;              // KV-Klasse: Methodenname ('render'); KV-Funktion: 'name#zeile';
                           // Komponente in KV-Funktion: 'Name#zeile'; AV: '<pfad>#<Name>'
  label?: string;          // Anzeigename (falls abweichend von id)
  width?: number; height?: number;          // von den Darstellungsregeln gesetzt
  lineStart?: number; lineEnd?: number;
  functions?: Node[];      // nur AV: innere Funktionen (für Vorschaukreise), sortiert
  icons?: NodeIcon[];
  type?: NodeType; kind?: NodeKind;
  special?: boolean;       // React-Spezialmethode (Lifecycle, render)
  returnsJSX?: boolean; isUsingThis?: boolean;
  componentId?: string; report?: any; extends?: boolean;
  warn?: boolean; error?: boolean; cluster?: number;
};
type Link = { source: string; target: string; value?: number; id?: string; inherits?: boolean };
type Graph = { nodes: Node[]; links: Link[] };
type FileMap = { [fileName: string]: { components?: ComponentMap; defaultExport?: string; code: string } };
type Component = { graph?: Graph; extends?: Import; dependencies?: Import[]; lineStart?: number; lineEnd?: number; kind?: NodeKind };
type Import = { name: string; source: string };
type NodeIcon = { icon: string; class: 'warn' | 'error'; description: string; width?: number };
```

## 5. escomplex-Report (verwendete Felder)

Struktur: `report.modules[]` mit `srcPath`, `methods[]` (Funktionen, auch Funktionskomponenten),
`classes[]` (mit `name`, `methods[]`, `aggregate`), `aggregate`. Pro Methode/Aggregat u. a.:
`sloc.physical`, `sloc.logical`, `cyclomatic`, `halstead.{difficulty,bugs,effort,length,time,vocabulary,volume,operands,operators}`,
`paramCount`, `lineStart`, `lineEnd`, `name`.
Ergänzt durch den Kern: `sloc.jsx`, `maxJsxNesting` (auf dem Komponenten-Report bzw. dessen `aggregate`).
Zahlen sind von escomplex bereits auf **3 Nachkommastellen** gerundet (z. B. `34.286`).
Die UI nutzt nur: die 7 Metriken aus `qualityMetrics`, `sloc.logical` (Icon „leere Funktion“),
`aggregate`, `name`, `lineStart`. Projektweite Felder (`adjacencyList` …) sind ungenutzt.

## 6. Eigenheiten, die erhalten bleiben (bug-kompatibel)

Diese Punkte sind **gewollt unverändert**. Wer sie ändern will, braucht eine ADR und neue Goldens.

| ID | Eigenheit | Ort |
|---|---|---|
| K1 | `generateAppGraph` beendet mit `return` (statt `continue`), wenn eine Datei keine `components` hat. Tritt praktisch nie ein, da `traverse` immer `{}` liefert. | `generateAppGraph.ts:15-17` |
| K2 | `previewCircleCompare` ist kein konsistenter Comparator (liefert teils `undefined`). Reihenfolge hängt am stabilen Sortieralgorithmus (seit ES2019 überall stabil → deterministisch). | `generateAppGraph.ts:102-126` |
| K3 | Funktionskomponenten-Report: Treffer bei `lineStart` **oder** `lineStart + 1`. | `findReport.ts:65-67` |
| K4 | „Absolute“ Imports (ohne `.`) werden relativ zum ersten `/src/` im Pfad der **ersten** Datei aufgelöst. | `traverseHelper.ts:541-549` |
| K5 | Mit `connect(...)(X)` erzeugte Komponenten haben **keinen** Graph und keinen Report → in der AV Breite 20, keine Icons. | `traverse.ts:117-141` |
| K6 | `render`, das nur `null` liefert, gilt nicht als „liefert JSX“; ohne `this` bekommt es das Scheren-Icon „helper function“. | `traverseHelper.ts:279-380` |
| K7 | Nach dem Zusammenführen von Aliasen können doppelte Kanten entstehen (z. B. zweimal `render → handleIncrement`). | `traverseHelper.ts:12-29` |
| K8 | IDs innerer Funktionen von Klassen sind reine Namen (gleichnamige kollidieren); bei Funktionskomponenten `name#zeile`. | `traverseClassComponent.ts`, `traverseFunctionComponent.ts` |
| K9 | Innere `function x() {}`-Deklarationen in Funktionskomponenten werden **nicht** als Knoten erfasst. | `traverseFunctionComponent.ts:44-84` |
| K10 | Getter/Setter von Klassen werden ignoriert. | `traverseClassComponent.ts:43-46` |
| K11 | Die Knotenreihenfolge folgt der **Eingabereihenfolge** der Dateien. Neu: Der Kern sortiert die Eingabe kanonisch (JS-Standardsortierung der Pfade), siehe ADR-006. Die Goldens werden mit derselben Sortierung erzeugt. | `data.service.ts:31` |

## 7. Plugin-Liste des Parsers (unverändert übernehmen)

`asyncGenerators, bigInt, classProperties, classPrivateProperties, classPrivateMethods,
['decorators', { decoratorsBeforeExport: true }], doExpressions, dynamicImport, exportDefaultFrom,
exportNamespaceFrom, functionBind, functionSent, importMeta, jsx, logicalAssignment,
nullishCoalescingOperator, numericSeparator, objectRestSpread, optionalCatchBinding,
optionalChaining, ['pipelineOperator', { proposal: 'minimal' }], throwExpressions`
+ `typescript` (für `.ts`/`.tsx`) bzw. `flow` (sonst). `sourceType: 'module'`, `sourceFilename: fileName`.

> Babel 8 entfernt u. a. `pipelineOperator: minimal` und ändert die AST-Form (dynamischer
> Import, TS-Knoten). Deshalb bleibt es vorerst bei Babel 7.29 (ADR-004, Sicherheitsupdates bis
> Juni 2027). Die Migration ist eine eigene Phase nach dem MVP (P11-S02).
