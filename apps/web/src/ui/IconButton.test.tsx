import { fireEvent } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { renderWithState } from '../test/renderWithState';
import { Icon } from './Icon';
import { IconButton } from './IconButton';

describe('IconButton', () => {
    it('is named by its label, not by the ligature of the icon, and reports clicks', () => {
        const onClick = vi.fn();
        const { getByRole } = renderWithState(
            <IconButton aria-label="Zoom to fit" onClick={onClick}>
                <Icon name="all_out" />
            </IconButton>
        );

        const button = getByRole('button', { name: 'Zoom to fit' });
        expect(button.getAttribute('type')).toBe('button');
        expect(button.querySelector('[aria-hidden="true"]')?.textContent).toBe('all_out');
        fireEvent.click(button);
        expect(onClick).toHaveBeenCalledTimes(1);
    });
});
