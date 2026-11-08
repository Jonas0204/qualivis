import { posix } from 'node:path';
import pathBrowserify from 'path-browserify';
import { describe, expect, it } from 'vitest';

const cases = {
  resolve: [['/a/b', '../c'], ['/a/b/', './c/d'], ['/a', '/b'], ['/a//b'], ['/a/./b/../c']],
  dirname: [['/a/b/c.js'], ['/a'], ['/'], ['/a/b/']],
  extname: [['/a/b.test.js'], ['/a/.babelrc'], ['/a/b'], ['/a/b.d.ts']],
  relative: [
    ['/a/b', '/a/c'],
    ['/a/b/c', '/a'],
    ['/a', '/a/b/c'],
  ],
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
