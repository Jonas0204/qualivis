import { afterEach, describe, expect, it, vi } from 'vitest';
import { loadFixture } from '../../test/golden/loadFixture';
import type { SourceFile } from '../analysis/analyzeProject';
import { isComponentFile } from '../legacy/isComponentFile';
import type { ProjectFiles } from './projectFiles';
import { isConfigFile } from './projectFiles';
import { createImportResolver } from './resolveImport';

/** Splits files like the upload: config files, and component files as sources. */
const toProject = (files: readonly SourceFile[]): ProjectFiles => ({
    sources: files.filter(file => isComponentFile(file) === true),
    configs: files.filter(({ path }) => isConfigFile(path)),
});

const source = (path: string): SourceFile => ({ path, code: '' });
const config = (path: string, json: unknown): SourceFile => ({ path, code: JSON.stringify(json) });

afterEach(() => {
    vi.restoreAllMocks();
});

describe('createImportResolver in the monorepo fixture', () => {
    const resolve = createImportResolver(toProject(loadFixture('monorepo')));
    const webA = '/monorepo/apps/web-a';
    const ui = '/monorepo/shared/ui/src';

    it('resolves a relative specifier to the exact file, not its .styles neighbour (K12)', () => {
        expect(resolve('./Header', `${webA}/components/page/Page.tsx`)).toBe(
            `${webA}/components/page/Header.tsx`
        );
        expect(resolve('./Header.styles', `${webA}/components/page/Header.tsx`)).toBe(
            `${webA}/components/page/Header.styles.ts`
        );
    });

    it('resolves relative specifiers that leave the folder', () => {
        expect(resolve('../components/page/Page', `${webA}/src/main.tsx`)).toBe(
            `${webA}/components/page/Page.tsx`
        );
        expect(resolve('../../hooks/useToggle', `${ui}/components/button/Button.tsx`)).toBe(
            `${ui}/hooks/useToggle.ts`
        );
    });

    it('resolves a deep library import through the paths of the app tsconfig', () => {
        expect(
            resolve('@demo/ui/components/button/Button', `${webA}/components/page/Header.tsx`)
        ).toBe(`${ui}/components/button/Button.tsx`);
        expect(resolve('@demo/ui/types', `${webA}/components/page/Page.tsx`)).toBe(
            `${ui}/types.ts`
        );
    });

    it('resolves a data alias to a file outside every package', () => {
        expect(resolve('@data/sample', `${webA}/src/routes.ts`)).toBe(
            '/monorepo/dev-data/sample.ts'
        );
    });

    it('resolves a package name with src/ in the subpath, without a tsconfig', () => {
        expect(
            resolve('@demo/tokens/src/Swatch', '/monorepo/apps/web-b/components/Other.tsx')
        ).toBe('/monorepo/shared/tokens/src/Swatch.tsx');
    });

    it('gives undefined for external packages', () => {
        expect(resolve('react', `${webA}/components/page/Page.tsx`)).toBeUndefined();
        expect(resolve('@emotion/react', `${webA}/components/page/Page.tsx`)).toBeUndefined();
    });

    it('gives undefined for a relative specifier without a file', () => {
        expect(resolve('./Missing', `${webA}/components/page/Page.tsx`)).toBeUndefined();
    });
});

describe('createImportResolver with two separately dropped folders', () => {
    it('misses the tsconfig path but finds the file through the package name and src/', () => {
        // Both tsconfig files extend ../../tsconfig.base.json, which is not in the upload.
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
        const files = loadFixture('monorepo').flatMap(({ path, code }) => {
            for (const [from, to] of [
                ['/monorepo/apps/web-a/', '/web-a/'],
                ['/monorepo/shared/ui/', '/ui/'],
            ] as const) {
                if (path.startsWith(from)) {
                    return [{ path: to + path.slice(from.length), code }];
                }
            }
            return [];
        });
        const resolve = createImportResolver(toProject(files));

        expect(
            resolve('@demo/ui/components/button/Button', '/web-a/components/page/Header.tsx')
        ).toBe('/ui/src/components/button/Button.tsx');
        expect(resolve('@data/sample', '/web-a/src/routes.ts')).toBeUndefined();
        expect(warn).toHaveBeenCalledWith(
            'Extended config not found:',
            '../../tsconfig.base.json',
            '/web-a/tsconfig.json'
        );
    });
});

describe('createImportResolver', () => {
    it('finds the index file of a folder', () => {
        const resolve = createImportResolver({
            sources: [source('/r/src/App.tsx'), source('/r/src/widgets/index.ts')],
            configs: [],
        });
        expect(resolve('./widgets', '/r/src/App.tsx')).toBe('/r/src/widgets/index.ts');
        expect(resolve('./widgets/', '/r/src/App.tsx')).toBe('/r/src/widgets/index.ts');
        expect(resolve('.', '/r/src/widgets/List.tsx')).toBe('/r/src/widgets/index.ts');
    });

    it('tries the endings in order: as written, .ts, .tsx, .js, .jsx, .d.ts, then index', () => {
        const project = (paths: string[]) => ({ sources: paths.map(source), configs: [] });
        const from = '/r/App.tsx';
        expect(createImportResolver(project(['/r/a.js', '/r/a.ts']))('./a', from)).toBe('/r/a.ts');
        expect(createImportResolver(project(['/r/a.jsx', '/r/a.tsx']))('./a', from)).toBe(
            '/r/a.tsx'
        );
        expect(createImportResolver(project(['/r/a.d.ts', '/r/a.jsx']))('./a', from)).toBe(
            '/r/a.jsx'
        );
        expect(createImportResolver(project(['/r/a/index.ts', '/r/a.d.ts']))('./a', from)).toBe(
            '/r/a.d.ts'
        );
        expect(createImportResolver(project(['/r/a.ts', '/r/a.js']))('./a.js', from)).toBe(
            '/r/a.js'
        );
    });

    it('never matches by prefix or with another case (K12)', () => {
        const resolve = createImportResolver({
            sources: [source('/r/Button.styles.ts'), source('/r/button.tsx')],
            configs: [],
        });
        expect(resolve('./Button', '/r/App.tsx')).toBeUndefined();
    });

    it('adds endings to folder names with dots instead of taking them as an ending', () => {
        const resolve = createImportResolver({
            sources: [source('/r/v1.2/index.tsx'), source('/r/Card.view.tsx')],
            configs: [],
        });
        expect(resolve('./v1.2', '/r/App.tsx')).toBe('/r/v1.2/index.tsx');
        expect(resolve('./Card.view', '/r/App.tsx')).toBe('/r/Card.view.tsx');
    });

    it('only reads uploaded source files', () => {
        const resolve = createImportResolver({
            sources: [source('/r/App.tsx')],
            configs: [config('/r/data.json', {})],
        });
        expect(resolve('./data.json', '/r/App.tsx')).toBeUndefined();
    });

    describe('tsconfig paths', () => {
        const project = (paths: Record<string, string[]>, files: string[]): ProjectFiles => ({
            sources: files.map(source),
            configs: [config('/r/tsconfig.json', { compilerOptions: { paths } })],
        });

        it('matches a pattern without * only exactly', () => {
            const resolve = createImportResolver(
                project({ config: ['src/config.ts'] }, ['/r/src/config.ts'])
            );
            expect(resolve('config', '/r/src/App.tsx')).toBe('/r/src/config.ts');
            expect(resolve('config/x', '/r/src/App.tsx')).toBeUndefined();
        });

        it('matches prefix and suffix around the *', () => {
            const resolve = createImportResolver(
                project({ '~/*.data': ['data/*.ts'] }, ['/r/data/users.ts'])
            );
            expect(resolve('~/users.data', '/r/App.tsx')).toBe('/r/data/users.ts');
            expect(resolve('~/users', '/r/App.tsx')).toBeUndefined();
        });

        it('takes the pattern with the longest prefix, and an exact one first', () => {
            const resolve = createImportResolver(
                project(
                    {
                        '@x/*': ['short/*'],
                        '@x/deep/*': ['long/*'],
                        '@x/deep/a': ['exact/a'],
                        '@x/deep/a*': ['star/a*'],
                    },
                    [
                        '/r/short/deep/b.ts',
                        '/r/long/b.ts',
                        '/r/long/a.ts',
                        '/r/star/a.ts',
                        '/r/exact/a.ts',
                    ]
                )
            );
            expect(resolve('@x/deep/b', '/r/App.tsx')).toBe('/r/long/b.ts');
            expect(resolve('@x/deep/a', '/r/App.tsx')).toBe('/r/exact/a.ts');
        });

        it('tries the targets in order', () => {
            const resolve = createImportResolver(
                project({ '@/*': ['missing/*', 'src/*', 'lib/*'] }, ['/r/lib/a.ts', '/r/src/a.ts'])
            );
            expect(resolve('@/a', '/r/App.tsx')).toBe('/r/src/a.ts');
        });

        it('falls back to the package name when no target exists', () => {
            const resolve = createImportResolver({
                sources: [source('/r/app/App.tsx'), source('/r/lib/src/Button.tsx')],
                configs: [
                    config('/r/app/tsconfig.json', {
                        compilerOptions: { paths: { '@lib/*': ['../missing/*'] } },
                    }),
                    config('/r/lib/package.json', { name: '@lib' }),
                ],
            });
            expect(resolve('@lib/Button', '/r/app/App.tsx')).toBe('/r/lib/src/Button.tsx');
        });

        it('does not apply to relative specifiers', () => {
            const resolve = createImportResolver(
                project({ '*': ['src/*'] }, ['/r/src/Missing.ts', '/r/src/a.ts'])
            );
            expect(resolve('./Missing', '/r/App.tsx')).toBeUndefined();
            expect(resolve('a', '/r/App.tsx')).toBe('/r/src/a.ts');
        });
    });

    describe('package names', () => {
        it('takes the longest matching name, and only at a / boundary', () => {
            const resolve = createImportResolver({
                sources: [source('/r/ui/a.ts'), source('/r/ui-extra/a.ts'), source('/r/x/a.ts')],
                configs: [
                    config('/r/ui/package.json', { name: '@demo/ui' }),
                    config('/r/ui-extra/package.json', { name: '@demo/ui-extra' }),
                    config('/r/x/package.json', { name: '@demo/ui/x' }),
                ],
            });
            expect(resolve('@demo/ui/a', '/r/App.tsx')).toBe('/r/ui/a.ts');
            expect(resolve('@demo/ui-extra/a', '/r/App.tsx')).toBe('/r/ui-extra/a.ts');
            expect(resolve('@demo/ui/x/a', '/r/App.tsx')).toBe('/r/x/a.ts');
            expect(resolve('@demo/u/a', '/r/App.tsx')).toBeUndefined();
            expect(resolve('@demo/ui-a', '/r/App.tsx')).toBeUndefined();
        });

        it('tries <dir>/<sub> before <dir>/src/<sub>', () => {
            const resolve = createImportResolver({
                sources: [source('/r/ui/Button.tsx'), source('/r/ui/src/Button.tsx')],
                configs: [config('/r/ui/package.json', { name: 'ui' })],
            });
            expect(resolve('ui/Button', '/r/App.tsx')).toBe('/r/ui/Button.tsx');
        });

        it('uses the entry fields source, module, main in that order if the file is uploaded', () => {
            const pkg = {
                name: 'lib',
                source: 'src/missing.ts',
                module: 'esm/x',
                main: 'cjs/x.js',
            };
            const resolve = createImportResolver({
                sources: [source('/r/lib/esm/x.js'), source('/r/lib/cjs/x.js')],
                configs: [config('/r/lib/package.json', pkg)],
            });
            expect(resolve('lib', '/r/App.tsx')).toBe('/r/lib/esm/x.js');
        });

        it('falls back to src/index, then index, without an uploaded entry', () => {
            const project = (paths: string[]): ProjectFiles => ({
                sources: paths.map(source),
                configs: [config('/r/lib/package.json', { name: 'lib', main: 'dist/index.js' })],
            });
            expect(
                createImportResolver(project(['/r/lib/index.ts', '/r/lib/src/index.tsx']))(
                    'lib',
                    '/r/App.tsx'
                )
            ).toBe('/r/lib/src/index.tsx');
            expect(createImportResolver(project(['/r/lib/index.js']))('lib', '/r/App.tsx')).toBe(
                '/r/lib/index.js'
            );
            expect(
                createImportResolver(project(['/r/lib/a.ts']))('lib', '/r/App.tsx')
            ).toBeUndefined();
        });

        it('ignores packages without a name', () => {
            const resolve = createImportResolver({
                sources: [source('/r/lib/a.ts')],
                configs: [config('/r/lib/package.json', { private: true })],
            });
            expect(resolve('lib/a', '/r/App.tsx')).toBeUndefined();
        });
    });

    it('reads the tsconfig of a folder once', () => {
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
        const resolve = createImportResolver({
            sources: [source('/r/a.ts')],
            configs: [config('/r/tsconfig.json', { extends: './missing.json' })],
        });
        resolve('x', '/r/App.tsx');
        resolve('y', '/r/Other.tsx');
        expect(warn).toHaveBeenCalledTimes(1);
    });
});
