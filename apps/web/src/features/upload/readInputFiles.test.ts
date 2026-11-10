import { describe, expect, it } from 'vitest';
import { fileWithRelativePath, unreadableFile } from '../../test/fakeFiles';
import { readInputFiles } from './readInputFiles';

describe('readInputFiles', () => {
    it('prefixes webkitRelativePath with a slash and reads the content', async () => {
        const files = [
            fileWithRelativePath('my-app/src/App.js', 'const App = 1;'),
            fileWithRelativePath('my-app/src/components/Button.js', 'const Button = 2;'),
        ];

        expect(await readInputFiles(files)).toEqual({
            sources: [
                { path: '/my-app/src/App.js', code: 'const App = 1;' },
                { path: '/my-app/src/components/Button.js', code: 'const Button = 2;' },
            ],
            configs: [],
        });
    });

    it('reads only component files as sources, like the legacy app', async () => {
        const files = [
            fileWithRelativePath('my-app/src/App.js', 'const App = 1;'),
            unreadableFile('my-app/README.md'),
            unreadableFile('my-app/src/logo.png'),
            unreadableFile('my-app/src/App.test.js'),
            unreadableFile('my-app/src/data.json'),
            unreadableFile('my-app/node_modules/react/index.js'),
            unreadableFile('my-app/build/main.js'),
            unreadableFile('my-app/dist/main.js'),
        ];

        // Reading one of the unreadable files would reject the whole result.
        expect(await readInputFiles(files)).toEqual({
            sources: [{ path: '/my-app/src/App.js', code: 'const App = 1;' }],
            configs: [],
        });
    });

    it('reads config files outside the excluded folders as configs (ADR-019)', async () => {
        const files = [
            fileWithRelativePath('repo/package.json', '{"name":"root"}'),
            fileWithRelativePath('repo/app/tsconfig.app.json', '{}'),
            fileWithRelativePath('repo/app/App.js', 'const App = 1;'),
            unreadableFile('repo/node_modules/react/package.json'),
            unreadableFile('repo/dist/tsconfig.json'),
        ];

        // Reading one of the unreadable files would reject the whole result.
        expect(await readInputFiles(files)).toEqual({
            sources: [{ path: '/repo/app/App.js', code: 'const App = 1;' }],
            configs: [
                { path: '/repo/package.json', code: '{"name":"root"}' },
                { path: '/repo/app/tsconfig.app.json', code: '{}' },
            ],
        });
    });

    it('skips files in .venv folders (ADR-011 A18)', async () => {
        const files = [
            fileWithRelativePath('my-app/src/App.js', 'const App = 1;'),
            unreadableFile('my-app/.venv/lib/python3.13/site-packages/playwright/types.d.ts'),
            unreadableFile('my-app/.venv/lib/python3.13/site-packages/playwright/package.json'),
        ];

        // Reading one of the unreadable files would reject the whole result.
        expect(await readInputFiles(files)).toEqual({
            sources: [{ path: '/my-app/src/App.js', code: 'const App = 1;' }],
            configs: [],
        });
    });

    it('skips files in __tests__ folders (ADR-011 A19)', async () => {
        const files = [
            fileWithRelativePath('my-app/src/App.js', 'const App = 1;'),
            unreadableFile('my-app/src/components/__tests__/SliderTest.tsx'),
        ];

        // Reading the unreadable file would reject the whole result.
        expect(await readInputFiles(files)).toEqual({
            sources: [{ path: '/my-app/src/App.js', code: 'const App = 1;' }],
            configs: [],
        });
    });

    it('skips a python folder with a Python project and everything in it (ADR-011 A19)', async () => {
        const files = [
            fileWithRelativePath('repo/web/src/App.tsx', 'const App = 1;'),
            unreadableFile('repo/python/server/main.py'),
            unreadableFile('repo/python/server/app/assets/FileLoaderWorker-1a2b3c4d.js'),
            unreadableFile('repo/python/server/package.json'),
        ];

        // Reading one of the unreadable files would reject the whole result.
        expect(await readInputFiles(files)).toEqual({
            sources: [{ path: '/repo/web/src/App.tsx', code: 'const App = 1;' }],
            configs: [],
        });
    });

    it('reads a python folder without a Python project', async () => {
        const files = [fileWithRelativePath('repo/python/Widget.js', 'const Widget = 1;')];

        expect(await readInputFiles(files)).toEqual({
            sources: [{ path: '/repo/python/Widget.js', code: 'const Widget = 1;' }],
            configs: [],
        });
    });

    it('returns empty lists for an empty selection', async () => {
        expect(await readInputFiles([])).toEqual({ sources: [], configs: [] });
    });
});
