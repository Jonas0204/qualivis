import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';
import type { SourceFile } from '../../src/index';

export const repoRoot = resolve(import.meta.dirname, '../../../..');

const walk = (dir: string): string[] =>
  readdirSync(dir).flatMap(name => {
    const full = join(dir, name);
    return statSync(full).isDirectory() ? walk(full) : [full];
  });

/** Same input the legacy capture used: '/<fixture>/<relative path>', canonical sort order. */
export const loadFixture = (fixture: string): SourceFile[] => {
  const root = join(repoRoot, 'testdata', 'fixtures', fixture);
  return (
    walk(root)
      // Windows paths → POSIX paths (no-op on macOS and Linux).
      .map(full => relative(root, full).split('\\').join('/'))
      .sort()
      .map(rel => ({ path: `/${fixture}/${rel}`, code: readFileSync(join(root, rel), 'utf8') }))
  );
};

export const readGolden = (fixture: string, file: string): unknown =>
  JSON.parse(readFileSync(join(repoRoot, 'testdata', 'golden', fixture, file), 'utf8'));
