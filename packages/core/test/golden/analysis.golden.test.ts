// Golden master G1: the new core must reproduce the legacy build's analysis.
// Reference data: testdata/golden/<fixture>/legacy-*.json (captured from the gh-pages build).
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, it } from 'vitest';
import { analyzeProject } from '../../src/index';
import { expectGoldenEqual } from './compare';
import { loadFixture, readGolden, repoRoot } from './loadFixture';

const fixtures = ['mini', 'realworld'] as const;

describe.each(fixtures)('G1 analysis golden master: %s', fixture => {
  const result = analyzeProject(loadFixture(fixture));

  // Always write the actual values for diffing (.cache is git-ignored).
  const out = join(repoRoot, '.cache', 'golden-actual', fixture);
  mkdirSync(out, { recursive: true });
  writeFileSync(join(out, 'report.json'), JSON.stringify(result.report, null, 2));
  writeFileSync(join(out, 'filemap.json'), JSON.stringify(result.fileMap, null, 2));
  writeFileSync(join(out, 'appgraph.json'), JSON.stringify(result.appGraph, null, 2));

  it('reproduces the escomplex report', () => {
    expectGoldenEqual(
      result.report,
      readGolden(fixture, 'legacy-report.json'),
      `${fixture} report`
    );
  });
  it('reproduces the file map (components, component graphs, per-node reports)', () => {
    const golden = readGolden(fixture, 'legacy-filemap.json');
    expectGoldenEqual(result.fileMap, golden, `${fixture} fileMap`);
  });
  it('reproduces the app graph including node order', () => {
    const golden = readGolden(fixture, 'legacy-appgraph.json');
    expectGoldenEqual(result.appGraph, golden, `${fixture} appGraph`);
  });
});
