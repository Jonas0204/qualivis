import { type AnalysisResult, analyzeProject, type VisualNode } from '@qualivis/core';
import { createStore } from 'jotai';
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { loadFixture } from '../test/fixtures';
import { analysisAtom, initialAnalysisState } from './analysisAtoms';
import { deselectAtom, selectFileAtom, selectionAtom, selectNodeAtom } from './selectionAtoms';

let mini: AnalysisResult;

beforeAll(() => {
    mini = analyzeProject(loadFixture('mini'));
});

const storeWithMini = () => {
    const store = createStore();
    store.set(analysisAtom, { ...initialAnalysisState, status: 'done', result: mini });
    return store;
};

describe('selectionAtom', () => {
    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('starts without a selection', () => {
        expect(createStore().get(selectionAtom)).toBeNull();
    });

    it('selects a graph node with the fields of the legacy selectNode, code and lines, and logs it', () => {
        const log = vi.spyOn(console, 'log').mockImplementation(() => {});
        const store = storeWithMini();
        const icons = [
            { icon: 'warning', class: 'warn' as const, description: { text: 'Too long' } },
        ];
        const node: VisualNode = {
            id: '/mini/src/App.js#App',
            label: 'App',
            type: 'component',
            report: { aggregate: {} },
            icons,
            width: 62,
            height: 62,
            warn: true,
            error: false,
            x: 10,
            y: 20,
        };

        store.set(selectNodeAtom, node, undefined);

        const selected = {
            id: '/mini/src/App.js#App',
            label: 'App',
            type: 'component',
            report: { aggregate: {} },
            icons,
            code: mini.fileMap['/mini/src/App.js']?.code,
            lineStart: 8,
            lineEnd: 72,
        };
        expect(store.get(selectionAtom)).toEqual([selected]);
        expect(log).toHaveBeenCalledWith('Select node: ', selected);
    });

    it('selects the components of a file with icons and logs them', () => {
        const log = vi.spyOn(console, 'log').mockImplementation(() => {});
        const store = storeWithMini();

        store.set(selectFileAtom, '/mini/src/components/Header.js');

        const selection = store.get(selectionAtom);
        expect(selection?.map(each => each.id)).toEqual(['/mini/src/components/Header.js#Header']);
        expect(selection?.[0]?.icons?.map(icon => icon.icon)).toContain('device_hub');
        expect(log).toHaveBeenCalledWith('Select file -> nodes: ', selection);
    });

    it('clears the selection to null', () => {
        vi.spyOn(console, 'log').mockImplementation(() => {});
        const store = storeWithMini();
        store.set(selectFileAtom, '/mini/src/components/Header.js');

        store.set(deselectAtom);

        expect(store.get(selectionAtom)).toBeNull();
    });
});
