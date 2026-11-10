import { describe, expect, it } from 'vitest';
import { fileWithRelativePath, unreadableFile } from '../../test/fakeFiles';
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

    it('reads only component files, like the legacy app', async () => {
        const files = [
            fileWithRelativePath('my-app/src/App.js', 'const App = 1;'),
            unreadableFile('my-app/package.json'),
            unreadableFile('my-app/src/logo.png'),
            unreadableFile('my-app/src/App.test.js'),
            unreadableFile('my-app/node_modules/react/index.js'),
            unreadableFile('my-app/build/main.js'),
            unreadableFile('my-app/dist/main.js'),
        ];

        // Reading one of the unreadable files would reject the whole result.
        expect(await readInputFiles(files)).toEqual([
            { path: '/my-app/src/App.js', code: 'const App = 1;' },
        ]);
    });

    it('skips files in .venv folders (ADR-011 A18)', async () => {
        const files = [
            fileWithRelativePath('my-app/src/App.js', 'const App = 1;'),
            unreadableFile('my-app/.venv/lib/python3.13/site-packages/playwright/types.d.ts'),
        ];

        // Reading the unreadable file would reject the whole result.
        expect(await readInputFiles(files)).toEqual([
            { path: '/my-app/src/App.js', code: 'const App = 1;' },
        ]);
    });

    it('returns an empty list for an empty selection', async () => {
        expect(await readInputFiles([])).toEqual([]);
    });
});
