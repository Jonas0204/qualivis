import { expect } from 'vitest';

export type Tolerated = { path: string; expected: number; actual: number };

const isFloatTolerated = (path: string) =>
  /(^|\.)(halstead|maintainability|cyclomaticDensity)(\.|$)/.test(path);

/**
 * Deep comparison like toEqual (key order does not matter, array order does). Floats below
 * halstead.*, maintainability and cyclomaticDensity may differ by ≤ 1 % or ≤ 0.01 (Teststrategie
 * §3); every tolerated difference is collected in `tolerated`.
 */
export const diffGolden = (
  actual: unknown,
  expected: unknown,
  path = '$',
  tolerated: Tolerated[] = []
): string[] => {
  if (Object.is(actual, expected)) return [];
  if (typeof actual === 'number' && typeof expected === 'number' && isFloatTolerated(path)) {
    const abs = Math.abs(actual - expected);
    const rel = expected === 0 ? abs : abs / Math.abs(expected);
    if (abs <= 0.01 || rel <= 0.01) {
      tolerated.push({ path, expected, actual });
      return [];
    }
  }
  if (
    typeof actual !== 'object' ||
    typeof expected !== 'object' ||
    actual === null ||
    expected === null
  ) {
    return [`${path}: expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`];
  }
  if (Array.isArray(actual) !== Array.isArray(expected)) return [`${path}: array/object mismatch`];
  const keys = new Set([...Object.keys(actual), ...Object.keys(expected)]);
  return [...keys].flatMap(k =>
    diffGolden(
      (actual as Record<string, unknown>)[k],
      (expected as Record<string, unknown>)[k],
      `${path}.${k}`,
      tolerated
    )
  );
};

/**
 * Compares a result with a golden. JSON round trip first: the goldens come from localStorage
 * (no undefined values, no class instances). Prints every used tolerance.
 */
export const expectGoldenEqual = (actual: unknown, expected: unknown, label: string): void => {
  const tolerated: Tolerated[] = [];
  const diffs = diffGolden(JSON.parse(JSON.stringify(actual)), expected, '$', tolerated);
  if (tolerated.length > 0) {
    console.warn(
      `${label}: ${tolerated.length} tolerated float difference(s)`,
      tolerated.slice(0, 10)
    );
  }
  expect(diffs.slice(0, 20), `${label}: ${diffs.length} difference(s)`).toEqual([]);
};
