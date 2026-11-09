import { analyzeProject } from '@qualivis/core';
import { createStore } from 'jotai';
import { describe, expect, it } from 'vitest';
import { loadFixture } from '../test/fixtures';
import { analysisAtom, initialAnalysisState } from './analysisAtoms';
import { componentIdAtom, viewGraphAtom, viewModeAtom } from './viewAtoms';

describe('viewAtoms', () => {
    it('starts on the upload view with no component selected', () => {
        const store = createStore();
        expect(store.get(viewModeAtom)).toBe('upload');
        expect(store.get(componentIdAtom)).toBeUndefined();
    });

    it('stores the view mode and component id', () => {
        const store = createStore();
        store.set(viewModeAtom, 'graph');
        store.set(componentIdAtom, 'src/App.js');
        expect(store.get(viewModeAtom)).toBe('graph');
        expect(store.get(componentIdAtom)).toBe('src/App.js');
    });
});

describe('viewGraphAtom', () => {
    it('has no graph without an analysis result', () => {
        expect(createStore().get(viewGraphAtom)).toBeUndefined();
    });

    it('follows the analysis result and the component id', () => {
        const store = createStore();
        const result = analyzeProject(loadFixture('mini'));
        store.set(analysisAtom, { ...initialAnalysisState, status: 'done', result });

        const appGraph = store.get(viewGraphAtom);
        expect(appGraph?.view).toBe('app');
        expect(appGraph?.nodes).toHaveLength(8);

        store.set(componentIdAtom, '/mini/src/App.js#App');
        const componentGraph = store.get(viewGraphAtom);
        expect(componentGraph?.view).toBe('component');
        expect(componentGraph?.nodes.map(node => node.id)).toEqual(
            result.fileMap['/mini/src/App.js']?.components?.App?.graph?.nodes.map(node => node.id)
        );
    });
});
