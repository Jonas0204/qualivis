import { describe, expect, it } from 'vitest';
import { fileWithRelativePath } from '../../test/fakeFiles';
import { readInputFiles } from './readInputFiles';

describe('readInputFiles', () => {
  it('prefixes webkitRelativePath with a slash and reads the content', async () => {
    const files = [
      fileWithRelativePath('my-app/src/App.js', 'const App = 1;'),
      fileWithRelativePath('my-app/src/components/Button.js', 'const Button = 2;'),
    ];

    expect(await readInputFiles(files)).toEqual([
      { path: '/my-app/src/App.js', code: 'const App = 1;' },
      { path: '/my-app/src/components/Button.js', code: 'const Button = 2;' },
    ]);
  });

  it('returns an empty list for an empty selection', async () => {
    expect(await readInputFiles([])).toEqual([]);
  });
});
