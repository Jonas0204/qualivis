import { describe, expect, it } from 'vitest';
import { loadFixture } from '../../test/golden/loadFixture';
import { createImportResolver } from './resolveImport';
import { rewriteImports } from './rewriteImports';

const lines = (code: string) => code.split('\n');

describe('rewriteImports in the monorepo fixture', () => {
    const files = loadFixture('monorepo');
    const resolve = createImportResolver({
        sources: files.filter(({ path }) => /\.(tsx?|jsx?)$/.test(path)),
        configs: files.filter(({ path }) => path.endsWith('.json')),
    });
    const fixtureFile = (path: string) => {
        const file = files.find(candidate => candidate.path === path);
        if (!file) {
            throw new Error(`Missing fixture file ${path}`);
        }
        return file;
    };

    it('rewrites a library import of Header.tsx to a relative path with extension', () => {
        const header = fixtureFile('/monorepo/apps/web-a/components/page/Header.tsx');
        const { path, code } = rewriteImports(header, resolve);
        expect(path).toBe(header.path);
        expect(code).toContain("from '../../../../shared/ui/src/components/button/Button.tsx'");
        expect(code).toContain("from './Header.styles.ts'");
        expect(code).not.toContain('@demo/ui');
        expect(lines(code)).toHaveLength(lines(header.code).length);
    });

    it('keeps external and type-only imports as written, and every other line', () => {
        const page = fixtureFile('/monorepo/apps/web-a/components/page/Page.tsx');
        const before = lines(page.code);
        const after = lines(rewriteImports(page, resolve).code);
        expect(after).toHaveLength(before.length);
        const changed = before.flatMap((line, index) =>
            line === after[index] ? [] : [[line, after[index]]]
        );
        expect(changed).toEqual([
            [
                "import { Card } from '@demo/ui/components/card/Card';",
                "import { Card } from '../../../../shared/ui/src/components/card/Card.tsx';",
            ],
            ["import { Header } from './Header';", "import { Header } from './Header.tsx';"],
        ]);
        expect(after.some(line => line.includes("from 'react'"))).toBe(true);
        expect(after.some(line => line.includes("from '@demo/ui/types'"))).toBe(true);
    });
});

describe('rewriteImports', () => {
    it('keeps double quotes and rewrites several imports on one line', () => {
        const resolve = (specifier: string) =>
            ({ './Header': '/r/Header.tsx', '@lib/a': '/r/lib/a.ts' })[specifier];
        const file = {
            path: '/r/App.tsx',
            code: 'import { Header } from "./Header"; import a from \'@lib/a\';\nconst x = 1;',
        };
        expect(rewriteImports(file, resolve).code).toBe(
            'import { Header } from "./Header.tsx"; import a from \'./lib/a.ts\';\nconst x = 1;'
        );
    });

    it('rewrites re-exports and leaves unresolvable specifiers alone', () => {
        const resolve = (specifier: string) => (specifier === 'x' ? '/r/src/x.js' : undefined);
        const file = {
            path: '/r/src/deep/index.ts',
            code: "export * from 'x';\nexport { y } from 'y';",
        };
        expect(rewriteImports(file, resolve).code).toBe(
            "export * from '../x.js';\nexport { y } from 'y';"
        );
    });
});
