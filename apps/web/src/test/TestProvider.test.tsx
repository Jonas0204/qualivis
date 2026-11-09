import { act } from '@testing-library/react';
import { useAtomValue, useSetAtom } from 'jotai';
import { describe, expect, it } from 'vitest';
import { analysisAtom, analysisProgressAtom, initialAnalysisState } from '../state/analysisAtoms';
import { viewModeAtom } from '../state/viewAtoms';
import { renderHookWithState, renderWithState } from './renderWithState';
import { initial } from './TestProvider';

const ViewModeProbe = () => {
    const mode = useAtomValue(viewModeAtom);
    const setMode = useSetAtom(viewModeAtom);
    return (
        <button type="button" onClick={() => setMode('upload')}>
            {mode}
        </button>
    );
};

describe('TestProvider', () => {
    it('applies initial values before the first render', async () => {
        const { store, user, getByRole } = renderWithState(<ViewModeProbe />, {
            initialValues: [initial(viewModeAtom, 'graph')],
        });
        const button = getByRole('button', { name: 'graph' });
        await user.click(button);
        expect(button.textContent).toBe('upload');
        expect(store.get(viewModeAtom)).toBe('upload');
    });

    it('gives every render its own store', () => {
        const first = renderWithState(<ViewModeProbe />, {
            initialValues: [initial(viewModeAtom, 'graph')],
        });
        const second = renderWithState(<ViewModeProbe />);
        expect(first.store.get(viewModeAtom)).toBe('graph');
        expect(second.store.get(viewModeAtom)).toBe('upload');
    });

    it('works with hooks and derived atoms', () => {
        const running = { ...initialAnalysisState, status: 'running' as const, progress: 50 };
        const { result, store } = renderHookWithState(() => useAtomValue(analysisProgressAtom), {
            initialValues: [initial(analysisAtom, running)],
        });
        expect(result.current).toBe(50);
        act(() => store.set(analysisAtom, initialAnalysisState));
        expect(result.current).toBeUndefined();
    });

    it('type-checks initial values', () => {
        // @ts-expect-error viewModeAtom only accepts 'upload' | 'graph'
        const pair = initial(viewModeAtom, 'table');
        expect(pair).toHaveLength(2);
    });
});
