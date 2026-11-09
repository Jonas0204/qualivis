import { describe, expect, it } from 'vitest';
import {
  entryItem,
  fakeDataTransfer,
  fakeDirectoryEntry,
  fakeFileEntry,
  fileItem,
  fileWithRelativePath,
  stringItem,
} from '../../test/fakeFiles';
import { readDroppedFiles } from './readDroppedFiles';

const byPath = (a: { path: string }, b: { path: string }) => a.path.localeCompare(b.path);

describe('readDroppedFiles', () => {
  it('reads a folder with subfolders recursively, using entry.fullPath', async () => {
    const folder = fakeDirectoryEntry('/my-app', [
      fakeFileEntry('/my-app/package.json', '{}'),
      fakeDirectoryEntry('/my-app/src', [
        fakeFileEntry('/my-app/src/App.js', 'const App = 1;'),
        fakeDirectoryEntry('/my-app/src/components', [
          fakeFileEntry('/my-app/src/components/Button.js', 'const Button = 2;'),
        ]),
      ]),
    ]);

    const files = await readDroppedFiles(fakeDataTransfer([entryItem(folder)]));

    expect(files.sort(byPath)).toEqual([
      { path: '/my-app/package.json', code: '{}' },
      { path: '/my-app/src/App.js', code: 'const App = 1;' },
      { path: '/my-app/src/components/Button.js', code: 'const Button = 2;' },
    ]);
  });

  it('keeps reading a folder until the reader returns no more entries (ADR-011 A7)', async () => {
    const children = Array.from({ length: 250 }, (_, index) =>
      fakeFileEntry(`/big/file${index}.js`, `// ${index}`)
    );
    const folder = fakeDirectoryEntry('/big', children, 100);

    const files = await readDroppedFiles(fakeDataTransfer([entryItem(folder)]));

    expect(files).toHaveLength(250);
    expect(files.at(-1)).toEqual({ path: '/big/file249.js', code: '// 249' });
  });

  it('falls back to getAsFile with webkitRelativePath without webkitGetAsEntry', async () => {
    const file = fileWithRelativePath('my-app/src/App.js', 'const App = 1;');

    const files = await readDroppedFiles(fakeDataTransfer([fileItem(file)]));

    expect(files).toEqual([{ path: 'my-app/src/App.js', code: 'const App = 1;' }]);
  });

  it('ignores items that are not files', async () => {
    const files = await readDroppedFiles(
      fakeDataTransfer([stringItem(), entryItem(fakeFileEntry('/App.js', 'x'))])
    );

    expect(files).toEqual([{ path: '/App.js', code: 'x' }]);
  });
});
