import { act } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { fullScreenAtom } from '../../../state/viewAtoms';
import { renderWithState } from '../../../test/renderWithState';
import { GraphPage } from '../GraphPage';

const drawPage = () => renderWithState(<GraphPage codeQuality="Code Quality" />);

describe('GraphPage', () => {
    it('shows the graph and the code quality panel side by side', () => {
        const { container, getByRole } = drawPage();

        expect(container.querySelector('.qv-graph-area')).not.toBeNull();
        expect(getByRole('complementary', { name: 'Code quality' }).textContent).toBe(
            'Code Quality'
        );
    });

    it('hides the side column in full screen and keeps its panel mounted', () => {
        const { getByRole, queryByRole, store } = drawPage();

        act(() => store.set(fullScreenAtom, true));

        expect(queryByRole('complementary')).toBeNull();
        expect(getByRole('complementary', { hidden: true }).textContent).toBe('Code Quality');

        act(() => store.set(fullScreenAtom, false));
        expect(getByRole('complementary', { name: 'Code quality' })).toBeTruthy();
    });
});
