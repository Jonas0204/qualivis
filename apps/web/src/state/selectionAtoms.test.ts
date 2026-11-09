import type { VisualNode } from '@qualivis/core';
import { createStore } from 'jotai';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { selectGraphNodeAtom, selectionAtom } from './selectionAtoms';

describe('selectionAtom', () => {
    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('starts without a selection', () => {
        expect(createStore().get(selectionAtom)).toBeNull();
    });

    it('selects a graph node with the fields of the legacy selectNode and logs it', () => {
        const log = vi.spyOn(console, 'log').mockImplementation(() => {});
        const store = createStore();
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

        store.set(selectGraphNodeAtom, node);

        const selected = {
            id: '/mini/src/App.js#App',
            label: 'App',
            type: 'component',
            report: { aggregate: {} },
            icons,
        };
        expect(store.get(selectionAtom)).toEqual([selected]);
        expect(log).toHaveBeenCalledWith('Select node: ', selected);
    });
});
