import { describe, expect, it } from 'vitest';
import { findPythonFolders, isConfigFile, isExcludedFolder } from './projectFiles';

describe('isConfigFile', () => {
    it.each([
        '/a/package.json',
        '/a/tsconfig.json',
        '/a/tsconfig.app.json',
        '/a/jsconfig.json',
        'a/package.json',
    ])('accepts %s', path => {
        expect(isConfigFile(path)).toBe(true);
    });

    it.each([
        '/a/node_modules/x/package.json',
        '/a/dist/tsconfig.json',
        '/a/.venv/lib/site-packages/x/package.json',
        '/a/src/config.json',
        '/a/src/package.json.ts',
        '/a/my-tsconfig.json',
    ])('rejects %s', path => {
        expect(isConfigFile(path)).toBe(false);
    });
});

describe('isExcludedFolder', () => {
    it.each([
        '/a/node_modules',
        '/a/node_modules/react',
        '/a/build',
        '/a/dist',
        '/a/.venv',
        '/a/.venv/lib/python3.13/site-packages/x/types.d.ts',
        '/a/src/__tests__',
        '/a/src/components/__tests__/SliderTest.tsx',
        'a/node_modules',
        'a/__tests__/x.js',
    ])('skips %s', path => {
        expect(isExcludedFolder(path)).toBe(true);
    });

    it.each([
        '/a',
        '/a/src',
        '/a/distribution',
        '/a/venv',
        '/a/src/build.js',
        '/a/src/tests',
        '/a/src/my__tests__/x.js',
    ])('enters %s', path => {
        expect(isExcludedFolder(path)).toBe(false);
    });
});

describe('findPythonFolders', () => {
    it('finds a python folder with a Python project below it (ADR-011 A19)', () => {
        const paths = [
            '/repo/python/server/main.py',
            '/repo/python/server/app/assets/FileLoaderWorker-1a2b3c4d.js',
            '/repo/web/src/App.tsx',
        ];
        expect(findPythonFolders(paths)).toEqual(['/repo/python']);
    });

    it.each(['/repo/python/pyproject.toml', '/repo/python/tool/uv.lock', '/repo/python/a/b/c.py'])(
        'counts %s as a Python project',
        path => {
            expect(findPythonFolders([path, '/repo/python/x.js'])).toEqual(['/repo/python']);
        }
    );

    it.each([
        [
            'a python folder without Python files',
            ['/repo/python/app/x.js', '/repo/python/README.md'],
        ],
        ['Python files outside a python folder', ['/repo/scripts/build.py', '/repo/python.py']],
        [
            'other folder names',
            ['/repo/python-app/main.py', '/repo/mypython/main.py', '/repo/Python/main.py'],
        ],
        ['a file named python', ['/repo/python']],
    ])('finds nothing for %s', (_case, paths) => {
        expect(findPythonFolders(paths)).toEqual([]);
    });

    it('keeps the path form and lists nested python folders sorted', () => {
        const paths = ['repo/python/x.py', '/b/python/y.py', '/a/python/lib/python/z.py'];
        expect(findPythonFolders(paths)).toEqual([
            '/a/python',
            '/a/python/lib/python',
            '/b/python',
            'repo/python',
        ]);
    });

    it('finds the dropped folder itself if it is a python folder', () => {
        expect(findPythonFolders(['/python/app/main.py'])).toEqual(['/python']);
    });
});
