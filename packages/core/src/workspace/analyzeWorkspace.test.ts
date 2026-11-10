import { describe, expect, it } from 'vitest';
import { loadFixture } from '../../test/golden/loadFixture';
import { type AnalysisResult, analyzeProjectAsync } from '../analysis/analyzeProject';
import { isComponentFile } from '../legacy/isComponentFile';
import type { Graph } from '../model/graph';
import { analyzeWorkspaceAsync } from './analyzeWorkspace';
import type { ProjectFiles } from './projectFiles';
import { isConfigFile } from './projectFiles';

const files = loadFixture('monorepo');
const project: ProjectFiles = {
    sources: files.filter(file => isComponentFile(file) === true),
    configs: files.filter(({ path }) => isConfigFile(path)),
};

/** '/monorepo/apps/web-a/src/main.tsx#Root' → 'Root'. */
const componentName = (id: unknown) => String(id).split('#').pop();

const nodeNames = ({ nodes }: Graph) => nodes.map(({ id }) => componentName(id)).sort();

const linkNames = ({ links }: Graph) =>
    links.map(({ source, target }) => `${componentName(source)} → ${componentName(target)}`).sort();

describe('analyzeWorkspaceAsync in the monorepo fixture', () => {
    it('gives the nodes and links of app web-a from monorepo.NOTES.md', async () => {
        const { appGraph } = await analyzeWorkspaceAsync(project, {
            appDir: '/monorepo/apps/web-a',
        });
        expect(nodeNames(appGraph)).toEqual(['Button', 'Card', 'Header', 'Icon', 'Page', 'Root']);
        expect(linkNames(appGraph)).toEqual([
            'Button → Icon',
            'Card → Icon',
            'Header → Button',
            'Page → Card',
            'Page → Header',
            'Root → Page',
        ]);
    });

    it('puts the original code back into the file map', async () => {
        const { fileMap } = await analyzeWorkspaceAsync(project, {
            appDir: '/monorepo/apps/web-a',
        });
        const header = '/monorepo/apps/web-a/components/page/Header.tsx';
        expect(fileMap[header]?.code).toBe(files.find(({ path }) => path === header)?.code);
        expect(fileMap[header]?.code).toContain("from '@demo/ui/components/button/Button'");
    });

    it('gives Other → Swatch for app web-b', async () => {
        const { appGraph } = await analyzeWorkspaceAsync(project, {
            appDir: '/monorepo/apps/web-b',
        });
        expect(nodeNames(appGraph)).toEqual(['Other', 'Swatch']);
        expect(linkNames(appGraph)).toEqual(['Other → Swatch']);
    });

    it('reports the progress of the analysis up to 100 percent', async () => {
        const progress: number[] = [];
        await analyzeWorkspaceAsync(
            project,
            { appDir: '/monorepo/apps/web-b' },
            { onProgress: percent => progress.push(percent) }
        );
        // Two files, two calls each.
        expect(progress).toHaveLength(4);
        expect(progress.at(-1)).toBeCloseTo(100);
    });
});

describe('analyzeProjectAsync with the whole monorepo fixture (old way)', () => {
    it('gives the "Whole project" expectation of monorepo.NOTES.md (K4, K12)', async () => {
        const { appGraph }: AnalysisResult = await analyzeProjectAsync(project.sources);
        expect(nodeNames(appGraph)).toEqual([
            'Button',
            'ButtonWrapper',
            'Card',
            'Header',
            'Icon',
            'Other',
            'Page',
            'PageWrapper',
            'Root',
            'Swatch',
            'Unused',
        ]);
        expect(linkNames(appGraph)).toEqual(['Button → Icon', 'Card → Icon', 'Root → Page']);
    });
});
