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

        const { sources, configs } = await readDroppedFiles(fakeDataTransfer([entryItem(folder)]));

        expect(sources.sort(byPath)).toEqual([
            { path: '/my-app/index.js', code: 'render(App);' },
            { path: '/my-app/src/App.js', code: 'const App = 1;' },
            { path: '/my-app/src/components/Button.js', code: 'const Button = 2;' },
        ]);
        expect(configs).toEqual([]);
    });

    it('reads only component files as sources, like the legacy app', async () => {
        const folder = fakeDirectoryEntry('/my-app', [
            unreadableFileEntry('/my-app/README.md'),
            fakeDirectoryEntry('/my-app/src', [
                fakeFileEntry('/my-app/src/App.js', 'const App = 1;'),
                unreadableFileEntry('/my-app/src/App.test.js'),
                unreadableFileEntry('/my-app/src/logo.png'),
                unreadableFileEntry('/my-app/src/data.json'),
            ]),
        ]);
        const fallbackFile = unreadableFile('my-app/CHANGELOG.md');

        // Reading one of the unreadable files would reject the whole result.
        const files = await readDroppedFiles(
            fakeDataTransfer([fileItem(fallbackFile), entryItem(folder)])
        );

        expect(files).toEqual({
            sources: [{ path: '/my-app/src/App.js', code: 'const App = 1;' }],
            configs: [],
        });
    });

    it('reads package.json, tsconfig*.json and jsconfig*.json as configs (ADR-019)', async () => {
        const folder = fakeDirectoryEntry('/repo', [
            fakeFileEntry('/repo/package.json', '{"name":"root"}'),
            fakeFileEntry('/repo/tsconfig.base.json', '{}'),
            fakeDirectoryEntry('/repo/app', [
                fakeFileEntry('/repo/app/jsconfig.json', '{}'),
                fakeFileEntry('/repo/app/App.js', 'const App = 1;'),
            ]),
        ]);
        const fallbackFile = fileWithRelativePath('repo/lib/tsconfig.app.json', '{}');

        const files = await readDroppedFiles(
            fakeDataTransfer([fileItem(fallbackFile), entryItem(folder)])
        );

        expect(files).toEqual({
            sources: [{ path: '/repo/app/App.js', code: 'const App = 1;' }],
            configs: [
                { path: 'repo/lib/tsconfig.app.json', code: '{}' },
                { path: '/repo/package.json', code: '{"name":"root"}' },
                { path: '/repo/tsconfig.base.json', code: '{}' },
                { path: '/repo/app/jsconfig.json', code: '{}' },
            ],
        });
    });

    it('does not enter node_modules, build and dist (ADR-019)', async () => {
        // Entering one of the unreadable folders would reject the whole result.
        const folder = fakeDirectoryEntry('/my-app', [
            unreadableDirectoryEntry('/my-app/node_modules'),
            unreadableDirectoryEntry('/my-app/build'),
            fakeDirectoryEntry('/my-app/packages/ui', [
                unreadableDirectoryEntry('/my-app/packages/ui/dist'),
                fakeFileEntry('/my-app/packages/ui/Button.js', 'const Button = 2;'),
            ]),
        ]);

        const files = await readDroppedFiles(fakeDataTransfer([entryItem(folder)]));

        expect(files).toEqual({
            sources: [{ path: '/my-app/packages/ui/Button.js', code: 'const Button = 2;' }],
            configs: [],
        });
    });

    it('does not enter .venv folders and skips files in them (ADR-011 A18)', async () => {
        const folder = fakeDirectoryEntry('/my-app', [
            unreadableDirectoryEntry('/my-app/.venv'),
            fakeFileEntry('/my-app/App.js', 'const App = 1;'),
        ]);
        const fallbackFiles = [
            unreadableFile('my-app/.venv/lib/python3.13/site-packages/playwright/types.d.ts'),
            unreadableFile('my-app/.venv/lib/python3.13/site-packages/playwright/package.json'),
        ];

        // Reading the folder or one of the files would reject the whole result.
        const files = await readDroppedFiles(
            fakeDataTransfer([...fallbackFiles.map(fileItem), entryItem(folder)])
        );

        expect(files).toEqual({
            sources: [{ path: '/my-app/App.js', code: 'const App = 1;' }],
            configs: [],
        });
    });

    it('does not enter __tests__ folders and skips files in them (ADR-011 A19)', async () => {
        const folder = fakeDirectoryEntry('/my-app', [
            unreadableDirectoryEntry('/my-app/src/__tests__'),
            fakeFileEntry('/my-app/App.js', 'const App = 1;'),
        ]);
        const fallbackFile = unreadableFile('my-app/lib/__tests__/SliderTest.tsx');

        // Reading the folder or the file would reject the whole result.
        const files = await readDroppedFiles(
            fakeDataTransfer([fileItem(fallbackFile), entryItem(folder)])
        );

        expect(files).toEqual({
            sources: [{ path: '/my-app/App.js', code: 'const App = 1;' }],
            configs: [],
        });
    });

    it('reads nothing in a python folder with a Python project (ADR-011 A19)', async () => {
        const folder = fakeDirectoryEntry('/repo', [
            fakeDirectoryEntry('/repo/python', [
                fakeDirectoryEntry('/repo/python/server', [
                    unreadableFileEntry('/repo/python/server/package.json'),
                    fakeDirectoryEntry('/repo/python/server/app/assets', [
                        unreadableFileEntry(
                            '/repo/python/server/app/assets/FileLoaderWorker-1a2b3c4d.js'
                        ),
                    ]),
                    unreadableFileEntry('/repo/python/server/main.py'),
                ]),
            ]),
            fakeFileEntry('/repo/web/App.js', 'const App = 1;'),
        ]);

        // Reading one of the unreadable files would reject the whole result.
        const files = await readDroppedFiles(fakeDataTransfer([entryItem(folder)]));

        expect(files).toEqual({
            sources: [{ path: '/repo/web/App.js', code: 'const App = 1;' }],
            configs: [],
        });
    });

    it('reads a python folder without a Python project', async () => {
        const folder = fakeDirectoryEntry('/repo/python', [
            fakeFileEntry('/repo/python/Widget.js', 'const Widget = 1;'),
        ]);

        const files = await readDroppedFiles(fakeDataTransfer([entryItem(folder)]));

        expect(files).toEqual({
            sources: [{ path: '/repo/python/Widget.js', code: 'const Widget = 1;' }],
            configs: [],
        });
    });

    it('keeps reading a folder until the reader returns no more entries (ADR-011 A7)', async () => {
        const children = Array.from({ length: 250 }, (_, index) =>
            fakeFileEntry(`/big/file${index}.js`, `// ${index}`)
        );
        const folder = fakeDirectoryEntry('/big', children, 100);

        const { sources } = await readDroppedFiles(fakeDataTransfer([entryItem(folder)]));

        expect(sources).toHaveLength(250);
        expect(sources.at(-1)).toEqual({ path: '/big/file249.js', code: '// 249' });
    });

    it('falls back to getAsFile with webkitRelativePath without webkitGetAsEntry', async () => {
        const file = fileWithRelativePath('my-app/src/App.js', 'const App = 1;');

        const files = await readDroppedFiles(fakeDataTransfer([fileItem(file)]));

        expect(files).toEqual({
            sources: [{ path: 'my-app/src/App.js', code: 'const App = 1;' }],
            configs: [],
        });
    });

    it('ignores items that are not files', async () => {
        const files = await readDroppedFiles(
            fakeDataTransfer([stringItem(), entryItem(fakeFileEntry('/App.js', 'x'))])
        );

        expect(files).toEqual({ sources: [{ path: '/App.js', code: 'x' }], configs: [] });
    });
});
