# @qualivis/core

Framework-free analysis core of Qualivis. It finds the React components of a project, builds the
component graphs and the app graph, and computes the code metrics (typhonjs-escomplex). Runs in
Node and in the browser; no DOM, no React.

## Usage

```ts
import { analyzeProject } from '@qualivis/core';

const result = analyzeProject([
  { path: '/my-app/src/App.js', code: appSource },
  { path: '/my-app/src/Header.js', code: headerSource },
]);

result.fileMap; // per file: source, components with their graphs, default export
result.appGraph; // components and their relations; empty for a single-component project
result.report; // the full escomplex project report
```

`analyzeProjectAsync(files, { onProgress })` returns the same result, yields to the host after
every file and reports the progress in percent (like the legacy progress bar). Both functions throw
on syntax errors.

## Paths

- Absolute and POSIX style: start with `/`, separator `/`, e.g. `/my-app/src/App.js`, on every
  operating system. Relative imports between the files are resolved with these paths.
- Only `.js`, `.jsx`, `.ts` and `.tsx` files outside `node_modules`, `build` and `dist` are
  analysed; test files (`*.test.*`) are skipped (`isComponentFile`).
- The input order does not matter: the files are sorted by path first.

## Result

The types live in [src/model](src/model): `FileMap` and `Component` in `fileMap.ts`, `Graph`,
`Node` and `Link` in `graph.ts`, the escomplex report in `report.ts`. Constants for the metrics,
thresholds and settings are exported as well (`qualityMetrics`, `defaultSettings`, …).

## Compatibility

The analysis is the one of the legacy Angular app "Component Graph", copied 1:1 to
[src/legacy](src/legacy/README.md). The golden test G1 (`pnpm test:parity`) proves that report,
file map and app graph are identical to the legacy build for the test projects in
`testdata/fixtures/`. Babel 7.29 parses the code, typhonjs-escomplex-project 0.1 computes the
metrics; two of its old dependencies are patched (`patches/`).

## License

Not decided yet; the package is private and not published.
