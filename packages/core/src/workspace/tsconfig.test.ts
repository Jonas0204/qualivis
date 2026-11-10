import { afterEach, describe, expect, it, vi } from 'vitest';
import { loadFixture } from '../../test/golden/loadFixture';
import { isConfigFile } from './projectFiles';
import { pathMappingFor } from './tsconfig';

const config = (path: string, json: unknown) => ({ path, code: JSON.stringify(json, null, 2) });

const spyWarn = () => vi.spyOn(console, 'warn').mockImplementation(() => undefined);

afterEach(() => {
    vi.restoreAllMocks();
});

describe('pathMappingFor in the monorepo fixture', () => {
    const configs = loadFixture('monorepo').filter(({ path }) => isConfigFile(path));

    it('uses the paths of the app tsconfig for a component of web-a', () => {
        expect(pathMappingFor('/monorepo/apps/web-a/components/page/Page.tsx', configs)).toEqual({
            baseDir: '/monorepo/apps/web-a',
            paths: { '@demo/ui/*': ['../../shared/ui/src/*'], '@data/*': ['../../dev-data/*'] },
        });
    });

    it('inherits the paths of the base config, which is JSONC, for a file of shared/ui', () => {
        expect(
            pathMappingFor('/monorepo/shared/ui/src/components/button/Button.tsx', configs)
        ).toEqual({ baseDir: '/monorepo', paths: { '@data/*': ['dev-data/*'] } });
    });

    it('finds nothing for a file without a tsconfig.json above it', () => {
        expect(pathMappingFor('/monorepo/shared/tokens/src/Swatch.tsx', configs)).toBeUndefined();
        expect(pathMappingFor('/monorepo/dev-data/sample.ts', configs)).toBeUndefined();
    });
});

describe('pathMappingFor', () => {
    it('takes paths entirely from the child, without the patterns of the base', () => {
        const configs = [
            config('/r/tsconfig.base.json', {
                compilerOptions: { paths: { '@a/*': ['a/*'], '@b/*': ['b/*'] } },
            }),
            config('/r/app/tsconfig.json', {
                extends: '../tsconfig.base.json',
                compilerOptions: { strict: true, paths: { '@b/*': ['src/b/*'] } },
            }),
        ];
        expect(pathMappingFor('/r/app/src/main.ts', configs)).toEqual({
            baseDir: '/r/app',
            paths: { '@b/*': ['src/b/*'] },
        });
    });

    it('resolves paths from baseUrl, relative to the config that sets it', () => {
        const configs = [
            config('/r/tsconfig.base.json', { compilerOptions: { baseUrl: './src' } }),
            config('/r/app/tsconfig.json', {
                extends: '../tsconfig.base.json',
                compilerOptions: { paths: { '~/*': ['app/*'] } },
            }),
        ];
        expect(pathMappingFor('/r/app/main.ts', configs)).toEqual({
            baseDir: '/r/src',
            paths: { '~/*': ['app/*'] },
        });
    });

    it('adds .json to an extends path without it', () => {
        const configs = [
            config('/r/tsconfig.base.json', { compilerOptions: { paths: { '@x': ['x.ts'] } } }),
            config('/r/app/tsconfig.json', { extends: '../tsconfig.base' }),
        ];
        expect(pathMappingFor('/r/app/main.ts', configs)).toEqual({
            baseDir: '/r',
            paths: { '@x': ['x.ts'] },
        });
    });

    it('applies a list of extends in order: a later base wins', () => {
        const configs = [
            config('/r/one/tsconfig.json', { compilerOptions: { paths: { '@one/*': ['*'] } } }),
            config('/r/two/tsconfig.json', { compilerOptions: { paths: { '@two/*': ['*'] } } }),
            config('/r/app/tsconfig.json', {
                extends: ['../one/tsconfig', '../two/tsconfig.json'],
            }),
        ];
        expect(pathMappingFor('/r/app/main.ts', configs)).toEqual({
            baseDir: '/r/two',
            paths: { '@two/*': ['*'] },
        });
    });

    it('warns about an extends of a package and keeps the own paths', () => {
        const warn = spyWarn();
        const configs = [
            config('/r/tsconfig.json', {
                extends: '@tsconfig/strictest/tsconfig.json',
                compilerOptions: { paths: { '@/*': ['src/*'] } },
            }),
        ];
        expect(pathMappingFor('/r/src/main.ts', configs)).toEqual({
            baseDir: '/r',
            paths: { '@/*': ['src/*'] },
        });
        expect(warn).toHaveBeenCalledWith(
            'Extended config not found:',
            '@tsconfig/strictest/tsconfig.json',
            '/r/tsconfig.json'
        );
    });

    it('warns about an extends outside the upload, e.g. of an app folder dropped alone', () => {
        const warn = spyWarn();
        const configs = [
            config('/web-a/tsconfig.json', {
                extends: '../../tsconfig.base.json',
                compilerOptions: { paths: { '@demo/ui/*': ['../../shared/ui/src/*'] } },
            }),
        ];
        expect(pathMappingFor('/web-a/components/page/Page.tsx', configs)).toEqual({
            baseDir: '/web-a',
            paths: { '@demo/ui/*': ['../../shared/ui/src/*'] },
        });
        expect(warn).toHaveBeenCalledWith(
            'Extended config not found:',
            '../../tsconfig.base.json',
            '/web-a/tsconfig.json'
        );
    });

    it('stops at circular extends', () => {
        const warn = spyWarn();
        const configs = [
            config('/r/tsconfig.json', {
                extends: './tsconfig.base.json',
                compilerOptions: { paths: { '@/*': ['src/*'] } },
            }),
            config('/r/tsconfig.base.json', { extends: './tsconfig.json' }),
        ];
        expect(pathMappingFor('/r/main.ts', configs)).toEqual({
            baseDir: '/r',
            paths: { '@/*': ['src/*'] },
        });
        expect(warn).toHaveBeenCalledWith(
            'Circular extends:',
            '/r/tsconfig.json → /r/tsconfig.base.json → /r/tsconfig.json'
        );
    });

    it('uses the jsconfig.json of a folder without tsconfig.json, before a tsconfig further up', () => {
        const configs = [
            config('/r/tsconfig.json', { compilerOptions: { paths: { '@ts/*': ['*'] } } }),
            config('/r/js/jsconfig.json', { compilerOptions: { paths: { '@js/*': ['*'] } } }),
            config('/r/both/jsconfig.json', { compilerOptions: { paths: { '@js/*': ['*'] } } }),
            config('/r/both/tsconfig.json', { compilerOptions: { paths: { '@both/*': ['*'] } } }),
        ];
        expect(pathMappingFor('/r/js/a/App.jsx', configs)?.paths).toEqual({ '@js/*': ['*'] });
        expect(pathMappingFor('/r/both/App.tsx', configs)?.paths).toEqual({ '@both/*': ['*'] });
        expect(pathMappingFor('/r/other/App.tsx', configs)?.paths).toEqual({ '@ts/*': ['*'] });
    });

    it('takes the first referenced config with paths when the chain has none (Vite template)', () => {
        const configs = [
            config('/v/tsconfig.json', {
                files: [],
                references: [
                    { path: './missing' },
                    { path: './tsconfig.node.json' },
                    { path: './tsconfig.app.json' },
                ],
            }),
            config('/v/tsconfig.node.json', { compilerOptions: { types: ['node'] } }),
            config('/v/tsconfig.app.json', { compilerOptions: { paths: { '@/*': ['./src/*'] } } }),
        ];
        const warn = spyWarn();
        expect(pathMappingFor('/v/src/App.tsx', configs)).toEqual({
            baseDir: '/v',
            paths: { '@/*': ['./src/*'] },
        });
        expect(warn).not.toHaveBeenCalled();
    });

    it('takes a reference to a folder as its tsconfig.json', () => {
        const configs = [
            config('/v/tsconfig.json', { references: [{ path: './app' }] }),
            config('/v/app/tsconfig.json', { compilerOptions: { paths: { '@/*': ['src/*'] } } }),
        ];
        expect(pathMappingFor('/v/main.ts', configs)).toEqual({
            baseDir: '/v/app',
            paths: { '@/*': ['src/*'] },
        });
    });

    it('warns about an invalid nearest config and does not look further up', () => {
        const warn = spyWarn();
        const configs = [
            config('/r/tsconfig.json', { compilerOptions: { paths: { '@/*': ['src/*'] } } }),
            { path: '/r/app/tsconfig.json', code: '{ "compilerOptions": ' },
        ];
        expect(pathMappingFor('/r/app/main.ts', configs)).toBeUndefined();
        expect(warn).toHaveBeenCalledTimes(1);
        expect(warn).toHaveBeenCalledWith(
            'Invalid config file:',
            '/r/app/tsconfig.json',
            expect.any(SyntaxError)
        );
    });
});
