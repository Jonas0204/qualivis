import { describe, expect, it } from 'vitest';
import { analyzeProject, analyzeProjectAsync, type SourceFile } from './analyzeProject';

const app: SourceFile = {
  path: '/p/src/App.js',
  code: [
    "import React from 'react';",
    "import Child from './Child';",
    '',
    'export default function App() {',
    '  return <Child />;',
    '}',
    '',
  ].join('\n'),
};
const child: SourceFile = {
  path: '/p/src/Child.js',
  code: [
    "import React from 'react';",
    '',
    'export default function Child() {',
    '  return <div>child</div>;',
    '}',
    '',
  ].join('\n'),
};
const nonComponentFiles: SourceFile[] = [
  { path: '/p/README.md', code: '# Readme' },
  { path: '/p/src/a.test.js', code: 'export default () => <div />;' },
  { path: '/p/node_modules/x/index.js', code: 'export default () => <div />;' },
  { path: '/p/src/util.js', code: 'export const add = (a, b) => a + b;' },
];

describe('analyzeProject', () => {
  it('returns an empty result for an empty project', () => {
    const result = analyzeProject([]);
    expect(result.fileMap).toEqual({});
    expect(result.appGraph).toEqual({ nodes: [], links: [] });
  });

  it('leaves out files without components', () => {
    expect(Object.keys(analyzeProject([...nonComponentFiles, child]).fileMap)).toEqual([
      '/p/src/Child.js',
    ]);
  });

  it('skips the app graph for a single component but builds its component graph', () => {
    const { fileMap, appGraph } = analyzeProject([child]);
    expect(appGraph).toEqual({ nodes: [], links: [] });
    expect(Object.keys(fileMap)).toEqual(['/p/src/Child.js']);
    expect(fileMap['/p/src/Child.js']?.components?.Child?.graph?.nodes.length).toBeGreaterThan(0);
  });

  it('links a component to the component it renders in the app graph', () => {
    const { appGraph } = analyzeProject([app, child]);
    expect(appGraph.nodes.map(n => n.id)).toEqual(['/p/src/App.js#App', '/p/src/Child.js#Child']);
    expect(appGraph.links.map(l => [l.source, l.target])).toEqual([
      ['/p/src/App.js#App', '/p/src/Child.js#Child'],
    ]);
  });

  it('gives the same result for any input order', () => {
    const files = [...nonComponentFiles, app, child];
    expect(analyzeProject([...files].reverse())).toEqual(analyzeProject(files));
  });

  it('throws on a syntax error like the legacy app', () => {
    expect(() => analyzeProject([{ path: '/p/src/Broken.js', code: 'const = ;' }])).toThrow();
  });
});

describe('analyzeProjectAsync', () => {
  it('gives the same result as the sync variant and reports the progress like the legacy app', async () => {
    const files = [...nonComponentFiles, app, child];
    const progress: number[] = [];
    const result = await analyzeProjectAsync(files, { onProgress: p => progress.push(p) });

    expect(result).toEqual(analyzeProject(files));
    // 3 component files (App.js, Child.js, util.js): one call after parsing, one after traversing.
    expect(progress).toHaveLength(6);
    expect(progress.every((p, i) => i === 0 || p > (progress[i - 1] ?? 0))).toBe(true);
    expect(progress.at(-1)).toBeCloseTo(100, 9);
  });

  it('rejects on a syntax error', async () => {
    await expect(
      analyzeProjectAsync([{ path: '/p/src/Broken.js', code: 'const = ;' }])
    ).rejects.toThrow();
  });
});
