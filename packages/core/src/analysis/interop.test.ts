import { describe, expect, it } from 'vitest';
import { cjsDefault } from './interop';

describe('cjsDefault', () => {
  it('returns a function export unchanged', () => {
    const fn = () => 42;
    expect(cjsDefault(fn)).toBe(fn);
  });

  it('unwraps the default export of a Babel-compiled CommonJS module', () => {
    const fn = () => 42;
    expect(cjsDefault({ default: fn, __esModule: true })).toBe(fn);
  });

  it('returns an object without a default export unchanged', () => {
    const mod = { parse: () => 1 };
    expect(cjsDefault(mod)).toBe(mod);
  });

  it('returns a class unchanged (classes are functions)', () => {
    class Analyzer {}
    expect(cjsDefault(Analyzer)).toBe(Analyzer);
  });
});
