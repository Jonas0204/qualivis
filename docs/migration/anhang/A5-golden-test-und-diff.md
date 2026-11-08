# A5 – Golden-Test G1, Vergleich mit Toleranz, Diff-Werkzeug

Im Spike wurde die exakte Variante (`toEqual`) geprüft: 6/6 grün, 0 Abweichungen. Unten steht die
Planfassung mit Halstead-Toleranz (`06-teststrategie.md` §3).

## `packages/core/test/golden/loadFixture.ts`

```ts
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';

export const REPO = resolve(import.meta.dirname, '../../../..');

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap(name => {
    const full = join(dir, name);
    return statSync(full).isDirectory() ? walk(full) : [full];
  });
}

/** Same input the legacy capture used: '/<fixture>/<relative path>', canonical sort order. */
export function loadFixture(fixture: string) {
  const root = join(REPO, 'testdata', 'fixtures', fixture);
  return walk(root)
    .map(full => relative(root, full).split('\\').join('/'))
    .sort()
    .map(rel => ({ path: `/${fixture}/${rel}`, code: readFileSync(join(root, rel), 'utf8') }));
}

export function readGolden(fixture: string, file: string): unknown {
  return JSON.parse(readFileSync(join(REPO, 'testdata', 'golden', fixture, file), 'utf8'));
}
```

(`relative(...).split('\\')` macht Windows-Pfade POSIX-artig; auf macOS ist es wirkungslos.)

## `packages/core/test/golden/compare.ts`

```ts
import { expect } from 'vitest';

export type Tolerated = { path: string; expected: number; actual: number };

const isFloatTolerated = (path: string) => /(^|\.)(halstead|maintainability|cyclomaticDensity)(\.|$)/.test(path);

/** Deep comparison like toEqual; floats below halstead.* etc. may differ by ≤1 % or ≤0.01. */
export function diffGolden(actual: unknown, expected: unknown, path = '$', tolerated: Tolerated[] = []): string[] {
  if (Object.is(actual, expected)) return [];
  if (typeof actual === 'number' && typeof expected === 'number' && isFloatTolerated(path)) {
    const abs = Math.abs(actual - expected);
    const rel = expected === 0 ? abs : abs / Math.abs(expected);
    if (abs <= 0.01 || rel <= 0.01) {
      tolerated.push({ path, expected, actual });
      return [];
    }
  }
  if (typeof actual !== 'object' || typeof expected !== 'object' || actual === null || expected === null) {
    return [`${path}: expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`];
  }
  if (Array.isArray(actual) !== Array.isArray(expected)) return [`${path}: array/object mismatch`];
  const keys = new Set([...Object.keys(actual), ...Object.keys(expected)]);
  return [...keys].flatMap(k =>
    diffGolden((actual as Record<string, unknown>)[k], (expected as Record<string, unknown>)[k], `${path}.${k}`, tolerated)
  );
}

export function expectGoldenEqual(actual: unknown, expected: unknown, label: string): void {
  const tolerated: Tolerated[] = [];
  const diffs = diffGolden(JSON.parse(JSON.stringify(actual)), expected, '$', tolerated);
  if (tolerated.length > 0) {
    console.warn(`${label}: ${tolerated.length} tolerated float difference(s)`, tolerated.slice(0, 10));
  }
  expect(diffs.slice(0, 20), `${label}: ${diffs.length} difference(s)`).toEqual([]);
}
```

Der Pfad-Test greift auf Schlüsselnamen (`…halstead.difficulty`); Ganzzahlen unter `halstead`
(z. B. `operands.total`) sind ganzzahlig und weichen bei gleichem AST ohnehin nicht ab – weichen
sie ab, ist das ein echter Unterschied, und `abs ≤ 0.01` greift bei Ganzzahlen nie.
Eigene Tests für `diffGolden`: gleiche Objekte → `[]`; Halstead-Abweichung 0,5 % → toleriert und
protokolliert; `cyclomatic` 16 vs. 17 → Fehler; anderes Array-Element → Fehler mit Pfad.

## `packages/core/test/golden/analysis.golden.test.ts`

```ts
// Golden master G1: the new core must reproduce the legacy build's analysis.
// Reference data: testdata/golden/<fixture>/legacy-*.json (captured from the gh-pages build).
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, it } from 'vitest';
import { analyzeProject } from '../../src/index';
import { expectGoldenEqual } from './compare';
import { loadFixture, REPO, readGolden } from './loadFixture';

const FIXTURES = ['mini', 'realworld'] as const;

describe.each(FIXTURES)('G1 analysis golden master: %s', fixture => {
  const result = analyzeProject(loadFixture(fixture));

  // Always write the actual values for diffing (.cache is git-ignored).
  const out = join(REPO, '.cache', 'golden-actual', fixture);
  mkdirSync(out, { recursive: true });
  writeFileSync(join(out, 'report.json'), JSON.stringify(result.report, null, 2));
  writeFileSync(join(out, 'filemap.json'), JSON.stringify(result.fileMap, null, 2));
  writeFileSync(join(out, 'appgraph.json'), JSON.stringify(result.appGraph, null, 2));

  it('reproduces the escomplex report', () => {
    expectGoldenEqual(result.report, readGolden(fixture, 'legacy-report.json'), `${fixture} report`);
  });
  it('reproduces the file map (components, component graphs, per-node reports)', () => {
    expectGoldenEqual(result.fileMap, readGolden(fixture, 'legacy-filemap.json'), `${fixture} fileMap`);
  });
  it('reproduces the app graph including node order', () => {
    expectGoldenEqual(result.appGraph, readGolden(fixture, 'legacy-appgraph.json'), `${fixture} appGraph`);
  });
});
```

Hinweise:
- Objekt-Schlüssel-Reihenfolge ist egal, Array-Reihenfolge nicht → der dritte Test prüft auch die
  Knotenreihenfolge (relevant für Layout und Cluster).
- Im Spike traten genau zwei Ursachen für Abweichungen auf: (1) Windows-`path` statt POSIX →
  nur projektweite Felder (`adjacencyList`, `visibilityList`, `coreSize`, `changeCost`,
  `firstOrderDensity`) → `path-browserify` verwenden; (2) andere Dateireihenfolge → kanonisch sortieren.
- `import.meta.dirname` gibt es ab Node 20.11 (Node 24 erfüllt das).

## Diff-Werkzeug

Das Diff-Werkzeug liegt seit M0 im Repo: `tools/golden/diff-json.mjs` (mit Tests). Aufruf
(Windows und macOS gleich):
`node tools/golden/diff-json.mjs testdata/golden/mini/legacy-report.json .cache/golden-actual/mini/report.json`
