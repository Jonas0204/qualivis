import { describe, expect, it } from 'vitest';
import { loadFixture } from '../../test/golden/loadFixture';
import type { SourceFile } from '../analysis/analyzeProject';
import { isComponentFile } from '../legacy/isComponentFile';
import { findAppCandidates } from './appCandidates';
import type { ProjectFiles } from './projectFiles';
import { isConfigFile } from './projectFiles';

const toProject = (files: readonly SourceFile[]): ProjectFiles => ({
    sources: files.filter(file => isComponentFile(file) === true),
    configs: files.filter(({ path }) => isConfigFile(path)),
});

const source = (path: string): SourceFile => ({ path, code: '' });
const pkg = (path: string, json: unknown = {}): SourceFile => ({
    path,
    code: JSON.stringify(json),
});
const dirs = (project: ProjectFiles) => findAppCandidates(project).map(({ dir }) => dir);

describe('findAppCandidates', () => {
    it('offers the four packages of the monorepo fixture, not the workspace root', () => {
        expect(
            findAppCandidates(toProject(loadFixture('monorepo'))).map(({ name }) => name)
        ).toEqual(['web-a', 'web-b', '@demo/tokens', '@demo/ui']);
    });

    it('offers nothing for an upload with a single package', () => {
        expect(findAppCandidates(toProject(loadFixture('mini')))).toEqual([]);
        expect(
            dirs({ sources: [source('/app/src/App.tsx')], configs: [pkg('/app/package.json')] })
        ).toEqual([]);
    });

    it('offers nothing for an upload without package.json', () => {
        expect(dirs({ sources: [source('/app/src/App.tsx')], configs: [] })).toEqual([]);
    });

    it('gives a file to the deepest package that contains it', () => {
        const project: ProjectFiles = {
            sources: [source('/r/apps/web/nested/src/App.tsx')],
            configs: [
                pkg('/r/package.json'),
                pkg('/r/apps/web/package.json'),
                pkg('/r/apps/web/nested/package.json'),
            ],
        };
        expect(dirs(project)).toEqual(['/r/apps/web/nested']);
    });

    it('leaves out packages with only test files or no source files', () => {
        const project: ProjectFiles = {
            sources: [
                source('/r/a/src/A.tsx'),
                source('/r/b/src/B.tsx'),
                source('/r/testing/__tests__/T.tsx'),
                source('/r/testing/x.test.ts'),
            ],
            configs: [
                pkg('/r/package.json'),
                pkg('/r/a/package.json'),
                pkg('/r/b/package.json'),
                pkg('/r/testing/package.json'),
                pkg('/r/empty/package.json'),
            ],
        };
        expect(dirs(project)).toEqual(['/r/a', '/r/b']);
    });

    it('keeps every package when none contains all others (two dropped folders)', () => {
        const project: ProjectFiles = {
            sources: [source('/web/src/App.tsx'), source('/ui/src/Button.tsx')],
            configs: [pkg('/web/package.json'), pkg('/ui/package.json')],
        };
        expect(dirs(project)).toEqual(['/ui', '/web']);
    });

    it('does not take a folder with a similar name for a package folder', () => {
        const project: ProjectFiles = {
            sources: [source('/r/app-old/App.tsx'), source('/r/lib/x.ts')],
            configs: [pkg('/r/app/package.json'), pkg('/r/lib/package.json')],
        };
        expect(dirs(project)).toEqual(['/r/lib']);
    });
});
