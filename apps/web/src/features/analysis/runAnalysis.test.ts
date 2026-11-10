import {
    type AnalysisResult,
    type AnalyzeAsyncOptions,
    isComponentFile,
    isConfigFile,
    type ProjectFiles,
    type SourceFile,
} from '@qualivis/core';
import { createStore } from 'jotai';
import { describe, expect, it, vi } from 'vitest';
import { type AnalysisState, analysisAtom } from '../../state/analysisAtoms';
import { componentIdAtom, viewModeAtom } from '../../state/viewAtoms';
import { loadFixture } from '../../test/fixtures';
import { runAnalysis } from './runAnalysis';

const files: SourceFile[] = [{ path: '/app/src/App.js', code: 'export default () => null;' }];
const project: ProjectFiles = { sources: files, configs: [] };
const fakeResult = { fileMap: {}, appGraph: { nodes: [], links: [] } } as unknown as AnalysisResult;

const recordAnalysisStates = (store: ReturnType<typeof createStore>) => {
    const states: AnalysisState[] = [];
    store.sub(analysisAtom, () => states.push(store.get(analysisAtom)));
    return states;
};

const componentNames = (state: AnalysisState) =>
    state.result?.appGraph.nodes.map(({ id }) => id.split('#').pop()).sort();

describe('runAnalysis', () => {
    it('reports progress, stores the result and switches to the graph view', async () => {
        const store = createStore();
        store.set(componentIdAtom, '/app/src/Old.js');
        const states = recordAnalysisStates(store);
        const analyzeProject = async (
            _files: readonly SourceFile[],
            options?: AnalyzeAsyncOptions
        ) => {
            options?.onProgress?.(50);
            options?.onProgress?.(100);
            return fakeResult;
        };

        await runAnalysis(project, undefined, store, { analyzeProject });

        expect(states.map(state => [state.status, state.progress])).toEqual([
            ['running', 0],
            ['running', 50],
            ['running', 100],
            ['done', undefined],
        ]);
        expect(store.get(analysisAtom).result).toBe(fakeResult);
        expect(store.get(viewModeAtom)).toBe('graph');
        expect(store.get(componentIdAtom)).toBeUndefined();
    });

    it('analyses all source files the old way without an app folder', async () => {
        const analyzeProject = vi.fn(async () => fakeResult);
        const analyzeWorkspace = vi.fn(async () => fakeResult);

        await runAnalysis(project, undefined, createStore(), { analyzeProject, analyzeWorkspace });

        expect(analyzeProject).toHaveBeenCalledWith(files, expect.anything());
        expect(analyzeWorkspace).not.toHaveBeenCalled();
    });

    it('analyses the chosen app folder with its progress', async () => {
        const analyzeProject = vi.fn(async () => fakeResult);
        const analyzeWorkspace = vi.fn(
            async (_project: ProjectFiles, _choice: unknown, options?: AnalyzeAsyncOptions) => {
                options?.onProgress?.(100);
                return fakeResult;
            }
        );
        const store = createStore();
        const states = recordAnalysisStates(store);

        await runAnalysis(project, '/app', store, { analyzeProject, analyzeWorkspace });

        expect(analyzeWorkspace).toHaveBeenCalledWith(
            project,
            { appDir: '/app' },
            expect.anything()
        );
        expect(analyzeProject).not.toHaveBeenCalled();
        expect(states.map(state => [state.status, state.progress])).toEqual([
            ['running', 0],
            ['running', 100],
            ['done', undefined],
        ]);
    });

    it('stores an error message and returns to the upload view when the analysis fails', async () => {
        const store = createStore();
        const analyzeProject = () => Promise.reject(new SyntaxError('Unexpected token (3:4)'));

        await runAnalysis(project, undefined, store, { analyzeProject });

        expect(store.get(analysisAtom)).toEqual({
            status: 'error',
            progress: undefined,
            result: undefined,
            error: 'Analysis failed: Unexpected token (3:4)',
        });
        expect(store.get(viewModeAtom)).toBe('upload');
    });

    it('analyses the mini fixture with the real core', async () => {
        const store = createStore();

        await runAnalysis({ sources: loadFixture('mini'), configs: [] }, undefined, store);

        const { status, result } = store.get(analysisAtom);
        expect(status).toBe('done');
        expect(result?.appGraph.nodes).toHaveLength(8);
    });

    it('analyses app web-a of the monorepo fixture with the real core', async () => {
        const store = createStore();
        const all = loadFixture('monorepo');
        const monorepo: ProjectFiles = {
            sources: all.filter(file => isComponentFile(file) === true),
            configs: all.filter(({ path }) => isConfigFile(path)),
        };

        await runAnalysis(monorepo, '/monorepo/apps/web-a', store);

        expect(componentNames(store.get(analysisAtom))).toEqual([
            'Button',
            'Card',
            'Header',
            'Icon',
            'Page',
            'Root',
        ]);
    });
});
