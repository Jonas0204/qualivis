import { fireEvent } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { renderWithState } from '../test/renderWithState';
import { Button } from './Button';

describe('Button', () => {
    it('is a button of type "button" named by its text and reports clicks', () => {
        const onClick = vi.fn();
        const { getByRole } = renderWithState(<Button onClick={onClick}>Save</Button>);

        const button = getByRole('button', { name: 'Save' });
        expect(button.getAttribute('type')).toBe('button');
        fireEvent.click(button);
        expect(onClick).toHaveBeenCalledTimes(1);
    });

    it('marks variant and colour with classes and keeps its own class', () => {
        const { getByRole } = renderWithState(
            <Button variant="raised" color="primary" className="extra" type="submit">
                Save
            </Button>
        );

        const button = getByRole('button', { name: 'Save' });
        expect(button.className).toMatch(/raised/);
        expect(button.className).toMatch(/primary/);
        expect(button.className).toMatch(/extra/);
        expect(button.getAttribute('type')).toBe('submit');
    });

    it('is a text button without colour by default', () => {
        const { getByRole } = renderWithState(<Button>Zoom</Button>);

        const { className } = getByRole('button', { name: 'Zoom' });
        expect(className).toMatch(/text/);
        expect(className).not.toMatch(/primary/);
    });
});
