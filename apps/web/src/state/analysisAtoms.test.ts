import { createStore } from 'jotai';
import { describe, expect, it } from 'vitest';
import {
    type AnalysisState,
    analysisAtom,
    analysisErrorAtom,
    analysisProgressAtom,
    initialAnalysisState,
} from './analysisAtoms';

describe('analysisAtom', () => {
    it('starts idle without progress, result or error', () => {
        const store = createStore();
        expect(store.get(analysisAtom)).toEqual({
            status: 'idle',
            progress: undefined,
            result: undefined,
            error: undefined,
        });
        expect(store.get(analysisProgressAtom)).toBeUndefined();
    });

    it('stores a new state and the derived progress follows', () => {
        const store = createStore();
        const running: AnalysisState = { ...initialAnalysisState, status: 'running', progress: 40 };

        store.set(analysisAtom, running);
        expect(store.get(analysisAtom)).toEqual(running);
        expect(store.get(analysisProgressAtom)).toBe(40);

        store.set(analysisAtom, {
            ...running,
            status: 'error',
            progress: undefined,
            error: 'failed',
        });
        expect(store.get(analysisErrorAtom)).toBe('failed');
        expect(store.get(analysisProgressAtom)).toBeUndefined();
    });
});
