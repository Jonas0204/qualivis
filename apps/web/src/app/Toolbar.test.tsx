import { describe, expect, it } from 'vitest';
import { viewModeAtom } from '../state/viewAtoms';
import { renderWithState } from '../test/renderWithState';
import { initial } from '../test/TestProvider';
import { Toolbar } from './Toolbar';

describe('Toolbar', () => {
    it('shows the product name', () => {
        const { getByRole } = renderWithState(<Toolbar />);

        expect(getByRole('banner').textContent).toBe('Qualivis');
    });

    it('returns to the upload view when the title is clicked', async () => {
        const { store, user, getByRole } = renderWithState(<Toolbar />, {
            initialValues: [initial(viewModeAtom, 'graph')],
        });

        await user.click(getByRole('button', { name: 'Qualivis' }));

        expect(store.get(viewModeAtom)).toBe('upload');
    });
});
