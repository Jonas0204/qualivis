import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';
import type { SourceFile } from '@qualivis/core';

// Copy of packages/core/test/golden/loadFixture.ts: the web app may only import the core's
// public entry, not its test files.

const repoRoot = resolve(import.meta.dirname, '../../../..');

const walk = (dir: string): string[] =>
    readdirSync(dir).flatMap(name => {
        const full = join(dir, name);
        return statSync(full).isDirectory() ? walk(full) : [full];
    });

/** Files of `testdata/fixtures/<fixture>` as '/<fixture>/<relative path>', sorted. */
export const loadFixture = (fixture: string): SourceFile[] => {
    const root = join(repoRoot, 'testdata', 'fixtures', fixture);
    return (
        walk(root)
            // Windows paths → POSIX paths (no-op on macOS and Linux).
            .map(full => relative(root, full).split('\\').join('/'))
            .sort()
            .map(rel => ({
                path: `/${fixture}/${rel}`,
                code: readFileSync(join(root, rel), 'utf8'),
            }))
    );
};

/** A golden file of the legacy build, `testdata/golden/<fixture>/<file>`. */
export const readGolden = (fixture: string, file: string): unknown =>
    JSON.parse(readFileSync(join(repoRoot, 'testdata', 'golden', fixture, file), 'utf8'));

/** Names of the golden files of a fixture that start with `prefix`, sorted. */
export const goldenFiles = (fixture: string, prefix: string): string[] =>
    readdirSync(join(repoRoot, 'testdata', 'golden', fixture))
        .filter(file => file.startsWith(prefix))
        .sort();
