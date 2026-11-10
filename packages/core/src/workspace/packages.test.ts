import { afterEach, describe, expect, it, vi } from 'vitest';
import { loadFixture } from '../../test/golden/loadFixture';
import { findPackages } from './packages';
import { isConfigFile } from './projectFiles';

const file = (path: string, json: unknown) => ({ path, code: JSON.stringify(json, null, 2) });

afterEach(() => {
    vi.restoreAllMocks();
});

describe('findPackages', () => {
    it('finds the five packages of the monorepo fixture, the root included', () => {
        const configs = loadFixture('monorepo').filter(({ path }) => isConfigFile(path));
        expect(findPackages(configs)).toStrictEqual([
            { dir: '/monorepo', name: 'demo-root', entries: {} },
            { dir: '/monorepo/apps/web-a', name: 'web-a', entries: {} },
            { dir: '/monorepo/apps/web-b', name: 'web-b', entries: {} },
            { dir: '/monorepo/shared/tokens', name: '@demo/tokens', entries: {} },
            { dir: '/monorepo/shared/ui', name: '@demo/ui', entries: {} },
        ]);
    });

    it('reads the entry fields that are strings, as written', () => {
        const configs = [
            file('/r/lib/package.json', {
                name: 'lib',
                source: 'src/index.ts',
                module: './dist/index.mjs',
                main: 42,
                exports: { '.': './dist/index.js' },
            }),
        ];
        expect(findPackages(configs)).toStrictEqual([
            {
                dir: '/r/lib',
                name: 'lib',
                entries: { source: 'src/index.ts', module: './dist/index.mjs' },
            },
        ]);
    });

    it('keeps a package without a name', () => {
        expect(findPackages([file('/r/package.json', { private: true })])).toStrictEqual([
            { dir: '/r', entries: {} },
        ]);
    });

    it('sorts by folder and ignores tsconfig and jsconfig files', () => {
        const configs = [
            file('/r/b/package.json', { name: 'b' }),
            file('/r/a/tsconfig.json', {}),
            file('/r/a/package.json', { name: 'a' }),
            file('/r/jsconfig.json', {}),
            file('/r/package.json', { name: 'root', workspaces: ['a', 'b'] }),
        ];
        expect(findPackages(configs).map(({ dir }) => dir)).toEqual(['/r', '/r/a', '/r/b']);
    });

    it('warns about invalid JSON and skips the file', () => {
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
        const configs = [
            { path: '/r/a/package.json', code: '{ "name": ' },
            file('/r/b/package.json', { name: 'b' }),
        ];
        expect(findPackages(configs)).toStrictEqual([{ dir: '/r/b', name: 'b', entries: {} }]);
        expect(warn).toHaveBeenCalledWith(
            'Invalid config file:',
            '/r/a/package.json',
            expect.any(SyntaxError)
        );
    });
});
