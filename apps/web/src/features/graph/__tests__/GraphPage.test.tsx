import { act } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { NodeSelection } from '../../../state/selection';
import { selectionAtom } from '../../../state/selectionAtoms';
import { fullScreenAtom } from '../../../state/viewAtoms';
import { renderWithState } from '../../../test/renderWithState';
import { initial } from '../../../test/TestProvider';
import { GraphPage } from '../GraphPage';

const selected: NodeSelection = {
    id: 'render',
    label: 'render',
    type: 'innerFunction',
    report: {
        cyclomatic: 3,
        paramCount: 0,
        sloc: { physical: 34, logical: 20 },
        halstead: { difficulty: 34.286, bugs: 0.373 },
    },
};

const drawPage = () =>
    renderWithState(<GraphPage />, { initialValues: [initial(selectionAtom, [selected])] });

describe('GraphPage', () => {
    it('shows the graph and the code quality of the selection side by side', () => {
        const { container, getByRole } = drawPage();

        expect(container.querySelector('.qv-graph-area')).not.toBeNull();
        const side = getByRole('complementary', { name: 'Code quality' });
        expect(side.querySelector('h2')?.textContent).toBe('Code Quality render');
    });

    it('hides the side column in full screen and keeps its panel mounted', () => {
        const { getByRole, queryByRole, store } = drawPage();

        act(() => store.set(fullScreenAtom, true));

        expect(queryByRole('complementary')).toBeNull();
        const hidden = getByRole('complementary', { hidden: true });
        expect(hidden.querySelector('h2')?.textContent).toBe('Code Quality render');

        act(() => store.set(fullScreenAtom, false));
        expect(getByRole('complementary', { name: 'Code quality' })).toBeTruthy();
    });
});
