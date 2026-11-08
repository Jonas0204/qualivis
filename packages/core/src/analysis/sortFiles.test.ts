import { describe, expect, it } from 'vitest';
import { sortFiles } from './sortFiles';

const file = (path: string) => ({ path, code: '' });

describe('sortFiles', () => {
  it('orders by UTF-16 code units like Array.prototype.sort (ADR-006)', () => {
    const paths = ['/p/src/b.js', '/p/src/ä.js', '/p/src/a/b.js', '/p/src/a.js', '/p/src/A.js'];
    const sorted = sortFiles(paths.map(file)).map(f => f.path);
    expect(sorted).toEqual([
      '/p/src/A.js',
      '/p/src/a.js',
      '/p/src/a/b.js',
      '/p/src/b.js',
      '/p/src/ä.js',
    ]);
    expect(sorted).toEqual([...paths].sort());
  });

  it('does not change the input array', () => {
    const files = ['/p/b.js', '/p/a.js'].map(file);
    sortFiles(files);
    expect(files.map(f => f.path)).toEqual(['/p/b.js', '/p/a.js']);
  });
});
