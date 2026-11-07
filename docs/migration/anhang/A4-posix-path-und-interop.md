# A4 – Pfad-Modul für escomplex, CJS-Interop, escomplex-Adapter

Warum escomplex überhaupt ein Pfad-Modul braucht: ADR-005. Kurz: escomplex löst Importe relativ zu
den (immer POSIX-artigen) Dateipfaden auf; Nodes `path` ist unter Windows nicht POSIX und im Browser
nicht vorhanden. Lösung ohne kopierten Code: das npm-Paket **`path-browserify` 1.0.1** – das ist Nodes
`path.posix`, für Browser verpackt (MIT, keine Abhängigkeiten). Es läuft in Node und im Browser
identisch.

> Stand der Verifikation: Der Spike nutzte eine wortgleiche Portierung von Nodes POSIX-Code und ergab
> 0 Abweichungen. `path-browserify` ist dieselbe Logik (Stand Node 10). Für absolute Pfade sind die
> Ergebnisse gleich; G1 bestätigt das beim ersten Lauf (P03-S03/S05).

## Typdeklaration `packages/core/src/types/path-browserify.d.ts`

Statt eines zusätzlichen `@types/path-browserify`-Pakets genügt eine kleine Deklaration der fünf
genutzten Funktionen:

```ts
declare module 'path-browserify' {
  type PosixPath = {
    sep: '/';
    dirname(path: string): string;
    extname(path: string): string;
    relative(from: string, to: string): string;
    resolve(...paths: string[]): string;
  };
  const path: PosixPath;
  export default path;
}
```

## Test `packages/core/src/analysis/pathModule.test.ts`

Kurzer Gleichheitstest gegen `node:path` (`posix`) – nur als Absicherung, dass das Paket die
erwarteten Ergebnisse für unsere Pfadformen liefert (≈ 15 Fälle, absolute Pfade):

```ts
import { posix } from 'node:path';
import pathBrowserify from 'path-browserify';
import { describe, expect, it } from 'vitest';

const cases = {
  resolve: [['/a/b', '../c'], ['/a/b/', './c/d'], ['/a', '/b'], ['/a//b'], ['/a/./b/../c']],
  dirname: [['/a/b/c.js'], ['/a'], ['/'], ['/a/b/']],
  extname: [['/a/b.test.js'], ['/a/.babelrc'], ['/a/b'], ['/a/b.d.ts']],
  relative: [['/a/b', '/a/c'], ['/a/b/c', '/a'], ['/a', '/a/b/c']],
} as const;

describe('path-browserify matches node:path posix for project paths', () => {
  for (const [fn, list] of Object.entries(cases)) {
    for (const args of list) {
      it(`${fn}(${args.join(', ')})`, () => {
        // biome-ignore lint/suspicious/noExplicitAny: table-driven call of the same API on both
        const call = (m: any) => m[fn](...args);
        expect(call(pathBrowserify)).toBe(call(posix));
      });
    }
  }
  it('uses / as separator', () => expect(pathBrowserify.sep).toBe('/'));
});
```

## `packages/core/src/analysis/interop.ts`

```ts
// CommonJS interop: bundlers (rolldown/Vite 8) may hand us `module.exports` for a default
// import of a Babel-compiled CJS module (exports.default + __esModule), Node/Vitest hand us
// `exports.default`. This returns the real default export in both cases.
export function cjsDefault<T>(mod: T): T {
  if (typeof mod === 'function') return mod;
  const inner = (mod as { default?: T } | null)?.default;
  return inner ?? mod;
}
```

Verwendung in `legacy/traverse.ts` und `legacy/traverseHelper.ts` (statt
`import babelTraverse from '@babel/traverse'`):

```ts
import _babelTraverse from '@babel/traverse';
import { cjsDefault } from '../analysis/interop';

const babelTraverse = cjsDefault(_babelTraverse);
```

## `packages/core/src/analysis/escomplex.ts`

```ts
import pathBrowserify from 'path-browserify';
import _ESComplexProject from 'typhonjs-escomplex-project/dist/ESComplexProject';
import type { EscomplexReport } from '../model/report';
import { cjsDefault } from './interop';

const ESComplexProject = cjsDefault(_ESComplexProject);

/**
 * Runs typhonjs-escomplex-project like the legacy browser bundle did: with a POSIX path module
 * (legacy: the `path` npm polyfill). Node's win32 `path` would change project-level metrics
 * (adjacencyList, visibilityList, coreSize, ...) and does not exist in the browser (ADR-005).
 */
export function analyzeModules(modules: Array<{ ast: unknown; srcPath: string }>): EscomplexReport {
  return new ESComplexProject(pathBrowserify).analyze(modules) as EscomplexReport;
}
```

`path-browserify` ist ein CommonJS-Modul (`module.exports = posix`); der Default-Import liefert in
Node und Vite das Objekt selbst – `cjsDefault` ist dafür nicht nötig.

## Typdeklaration `packages/core/src/types/escomplex.d.ts`

```ts
declare module 'typhonjs-escomplex-project/dist/ESComplexProject' {
  export default class ESComplexProject {
    constructor(pathModule: object, options?: object);
    analyze(modules: Array<{ ast: unknown; srcPath: string }>, options?: object): unknown;
  }
}
```

(`EscomplexReport` aus `model/report.ts` darf bis P08-S01 ein bewusst grober Typ sein.)

## Vite-Alias für `path` (`apps/web/vite.config.ts`)

Der gepatchte `typhonjs-plugin-manager` enthält noch `require('path')` (wird nie aufgerufen). Ohne
Alias meldet Vite „Module "path" has been externalized for browser compatibility“. Mit Alias bekommt
er im Browser ebenfalls `path-browserify`:

```ts
import { fileURLToPath } from 'node:url';
// …
resolve: {
  alias: {
    // Resolved from apps/web, therefore path-browserify is also a dependency of @qualivis/web.
    path: fileURLToPath(import.meta.resolve('path-browserify')),
  },
},
```

Hinweis: Mit pnpm sieht `typhonjs-plugin-manager` das Paket `path-browserify` nicht (strikte
`node_modules`-Struktur). Deshalb löst der Alias den **absoluten Pfad** aus Sicht von `apps/web` auf;
`path-browserify` steht dafür auch in `apps/web/package.json`. Prüfen: Die Build-Warnung verschwindet
und `pnpm build` läuft durch (P04-S01).
