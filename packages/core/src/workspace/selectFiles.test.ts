import { describe, expect, it } from 'vitest';
import { loadFixture } from '../../test/golden/loadFixture';
import type { SourceFile } from '../analysis/analyzeProject';
import { isComponentFile } from '../legacy/isComponentFile';
import type { ProjectFiles } from './projectFiles';
import { isConfigFile } from './projectFiles';
import { isTestFile, selectAppFiles } from './selectFiles';

/** Splits files like the upload: config files, and component files as sources. */
const toProject = (files: readonly SourceFile[]): ProjectFiles => ({
    sources: files.filter(file => isComponentFile(file) === true),
    configs: files.filter(({ path }) => isConfigFile(path)),
});

const paths = (files: readonly SourceFile[]) => files.map(({ path }) => path);

describe('isTestFile', () => {
    it.each([
        '/a/__tests__/XTest.tsx',
        '/a/__mocks__/api.ts',
        '/a/x.test.tsx',
        '/a/x.spec.ts',
        '/a/Button.stories.tsx',
    ])('counts %s as a test', path => {
        expect(isTestFile(path)).toBe(true);
    });

    it.each([
        '/a/Contest.tsx',
        '/a/PageTest.tsx',
        '/a/tests/x.ts',
        '/a/x.testing.ts',
        '/a/spec.data/x.ts',
    ])('does not count %s as a test', path => {
        expect(isTestFile(path)).toBe(false);
    });
});

describe('selectAppFiles in the monorepo fixture', () => {
    const project = toProject(loadFixture('monorepo'));

    it('selects the app files of web-a and the library files they reach', () => {
        expect(paths(selectAppFiles(project, '/monorepo/apps/web-a'))).toEqual([
            '/monorepo/apps/web-a/components/page/Header.styles.ts',
            '/monorepo/apps/web-a/components/page/Header.tsx',
            '/monorepo/apps/web-a/components/page/Page.tsx',
            '/monorepo/apps/web-a/src/main.tsx',
            '/monorepo/apps/web-a/src/routes.ts',
            '/monorepo/dev-data/sample.ts',
            '/monorepo/shared/ui/src/components/button/Button.styles.ts',
            '/monorepo/shared/ui/src/components/button/Button.tsx',
            '/monorepo/shared/ui/src/components/card/Card.tsx',
            '/monorepo/shared/ui/src/components/icon/Icon.tsx',
            '/monorepo/shared/ui/src/hooks/useToggle.ts',
        ]);
    });

    it('selects Other and Swatch for web-b', () => {
        expect(paths(selectAppFiles(project, '/monorepo/apps/web-b'))).toEqual([
            '/monorepo/apps/web-b/components/Other.tsx',
            '/monorepo/shared/tokens/src/Swatch.tsx',
        ]);
    });

    it('keeps the code of the selected files', () => {
        const [first] = selectAppFiles(project, '/monorepo/apps/web-b');
        expect(first?.code).toContain("from '@demo/tokens/src/Swatch'");
    });
});

describe('selectAppFiles', () => {
    const file = (path: string, code = ''): SourceFile => ({ path, code });

    it('starts only in the app folder itself, without tests and .d.ts files', () => {
        const project: ProjectFiles = {
            sources: [
                file('/r/app/App.tsx'),
                file('/r/app/env.d.ts'),
                file('/r/app/App.test.tsx'),
                file('/r/app-old/Old.tsx'),
            ],
            configs: [],
        };
        expect(paths(selectAppFiles(project, '/r/app'))).toEqual(['/r/app/App.tsx']);
    });

    it('never adds a test file, even when a selected file imports it', () => {
        const project: ProjectFiles = {
            sources: [
                file('/r/app/App.tsx', "import { mock } from '../lib/__mocks__/api';"),
                file('/r/lib/__mocks__/api.ts', "import '../real';"),
                file('/r/lib/real.ts'),
            ],
            configs: [],
        };
        expect(paths(selectAppFiles(project, '/r/app'))).toEqual(['/r/app/App.tsx']);
    });

    it('follows re-exports and import chains, but not type-only imports', () => {
        const project: ProjectFiles = {
            sources: [
                file('/r/app/App.tsx', "export { Card } from '../lib/Card';"),
                file('/r/lib/Card.tsx', "import type { Props } from './props';\nimport './Icon';"),
                file('/r/lib/Icon.tsx', "export * from './icons';"),
                file('/r/lib/icons.ts'),
                file('/r/lib/props.ts'),
            ],
            configs: [],
        };
        expect(paths(selectAppFiles(project, '/r/app'))).toEqual([
            '/r/app/App.tsx',
            '/r/lib/Card.tsx',
            '/r/lib/Icon.tsx',
            '/r/lib/icons.ts',
        ]);
    });

    it('handles import cycles and uses the given resolver', () => {
        const project: ProjectFiles = {
            sources: [file('/r/app/a.ts', "import 'b';"), file('/r/lib/b.ts', "import 'a';")],
            configs: [],
        };
        const resolve = (specifier: string) => ({ a: '/r/app/a.ts', b: '/r/lib/b.ts' })[specifier];
        expect(paths(selectAppFiles(project, '/r/app', resolve))).toEqual([
            '/r/app/a.ts',
            '/r/lib/b.ts',
        ]);
    });
});
