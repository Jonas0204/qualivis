import { execFileSync } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterAll, describe, expect, it } from 'vitest';

const script = fileURLToPath(new URL('./diff-json.mjs', import.meta.url));
const temp = mkdtempSync(join(tmpdir(), 'qv-diff-json-'));
let counter = 0;

function writeJson(value) {
  counter += 1;
  const file = join(temp, `doc-${counter}.json`);
  writeFileSync(file, JSON.stringify(value));
  return file;
}

function runDiff(...args) {
  try {
    const out = execFileSync(process.execPath, [script, ...args], {
      encoding: 'utf8',
      stdio: 'pipe',
    });
    return { code: 0, out };
  } catch (err) {
    return { code: err.status, out: `${err.stdout}${err.stderr}` };
  }
}

afterAll(() => rmSync(temp, { recursive: true, force: true }));

describe('diff-json', () => {
  it('exits 0 and reports no differences for equal documents', () => {
    const doc = { a: { b: [1, 2, { c: 'x' }] } };
    const { code, out } = runDiff(writeJson(doc), writeJson(structuredClone(doc)));
    expect(code).toBe(0);
    expect(out).toContain('total differences: 0');
  });

  it('exits 1 and lists the path of a changed value', () => {
    const { code, out } = runDiff(writeJson({ a: { b: 1 } }), writeJson({ a: { b: 2 } }));
    expect(code).toBe(1);
    expect(out).toContain('total differences: 1');
    expect(out).toContain('$.a.b: 1 -> 2');
  });

  it('reports keys that exist on one side only', () => {
    const { code, out } = runDiff(writeJson({ a: 1 }), writeJson({ a: 1, extra: true }));
    expect(code).toBe(1);
    expect(out).toContain('$.extra: undefined -> true');
  });

  it('exits 2 with a usage message when arguments are missing', () => {
    const { code, out } = runDiff(writeJson({}));
    expect(code).toBe(2);
    expect(out).toContain('usage: diff-json.mjs');
  });
});
