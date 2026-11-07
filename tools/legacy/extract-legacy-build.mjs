// Extracts the legacy Angular production build (branch origin/gh-pages) to .cache/legacy-build.
// Read-only git operation (git archive); does not touch the working tree or index.
import { execFileSync } from 'node:child_process';
import { mkdirSync, rmSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const cacheDir = join(root, '.cache');
const target = join(cacheDir, 'legacy-build');
const tarFile = join(cacheDir, 'legacy-build.tar');
const ref = process.argv[2] ?? 'origin/gh-pages';

mkdirSync(cacheDir, { recursive: true });
rmSync(target, { recursive: true, force: true });
mkdirSync(target, { recursive: true });
execFileSync('git', ['archive', '--format=tar', '-o', tarFile, ref], {
  cwd: root,
  stdio: 'inherit',
});
// Relative paths on purpose: GNU tar (e.g. from Git Bash on Windows) reads "D:\..." as host:path.
execFileSync('tar', ['-xf', 'legacy-build.tar', '-C', 'legacy-build'], {
  cwd: cacheDir,
  stdio: 'inherit',
});
rmSync(tarFile, { force: true });
console.log(`Legacy build extracted from ${ref} to ${target}`);
