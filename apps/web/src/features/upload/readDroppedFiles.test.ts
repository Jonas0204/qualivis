import { describe, expect, it } from 'vitest';
import {
    entryItem,
    fakeDataTransfer,
    fakeDirectoryEntry,
    fakeFileEntry,
    fileItem,
    fileWithRelativePath,
    stringItem,
    unreadableDirectoryEntry,
    unreadableFile,
    unreadableFileEntry,
} from '../../test/fakeFiles';
import { readDroppedFiles } from './readDroppedFiles';

const byPath = (a: { path: string }, b: { path: string }) => a.path.localeCompare(b.path);

describe('readDroppedFiles', () => {
    it('reads a folder with subfolders recursively, using entry.fullPath', async () => {
        const folder = fakeDirectoryEntry('/my-app', [
            fakeFileEntry('/my-app/index.js', 'render(App);'),
            fakeDirectoryEntry('/my-app/src', [
                fakeFileEntry('/my-app/src/App.js', 'const App = 1;'),
                fakeDirectoryEntry('/my-app/src/components', [
                    fakeFileEntry('/my-app/src/components/Button.js', 'const Button = 2;'),
                ]),
            ]),
        ]);

        const files = await readDroppedFiles(fakeDataTransfer([entryItem(folder)]));

        expect(files.sort(byPath)).toEqual([
            { path: '/my-app/index.js', code: 'render(App);' },
            { path: '/my-app/src/App.js', code: 'const App = 1;' },
            { path: '/my-app/src/components/Button.js', code: 'const Button = 2;' },
        ]);
    });

    it('reads only component files, like the legacy app', async () => {
        const folder = fakeDirectoryEntry('/my-app', [
            unreadableFileEntry('/my-app/package.json'),
            fakeDirectoryEntry('/my-app/node_modules', [
                unreadableFileEntry('/my-app/node_modules/react/index.js'),
            ]),
            fakeDirectoryEntry('/my-app/src', [
                fakeFileEntry('/my-app/src/App.js', 'const App = 1;'),
                unreadableFileEntry('/my-app/src/App.test.js'),
                unreadableFileEntry('/my-app/src/logo.png'),
            ]),
        ]);
        const fallbackFile = unreadableFile('my-app/README.md');

        // Reading one of the unreadable files would reject the whole result.
        const files = await readDroppedFiles(
            fakeDataTransfer([fileItem(fallbackFile), entryItem(folder)])
        );

        expect(files).toEqual([{ path: '/my-app/src/App.js', code: 'const App = 1;' }]);
    });

    it('does not enter .venv folders and skips files in them (ADR-011 A18)', async () => {
        const folder = fakeDirectoryEntry('/my-app', [
            unreadableDirectoryEntry('/my-app/.venv'),
            fakeFileEntry('/my-app/App.js', 'const App = 1;'),
        ]);
        const fallbackFile = unreadableFile(
            'my-app/.venv/lib/python3.13/site-packages/playwright/types.d.ts'
        );

        // Reading the folder or the file would reject the whole result.
        const files = await readDroppedFiles(
            fakeDataTransfer([fileItem(fallbackFile), entryItem(folder)])
        );

        expect(files).toEqual([{ path: '/my-app/App.js', code: 'const App = 1;' }]);
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
