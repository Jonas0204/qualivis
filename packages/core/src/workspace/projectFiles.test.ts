import { describe, expect, it } from 'vitest';
import { isConfigFile, isExcludedFolder } from './projectFiles';

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
        'a/node_modules',
    ])('skips %s', path => {
        expect(isExcludedFolder(path)).toBe(true);
    });

    it.each(['/a', '/a/src', '/a/distribution', '/a/venv', '/a/src/build.js'])(
        'enters %s',
        path => {
            expect(isExcludedFolder(path)).toBe(false);
        }
    );
});
