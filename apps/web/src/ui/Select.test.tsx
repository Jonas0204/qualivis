import { fireEvent } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { renderWithState } from '../test/renderWithState';
import { Select } from './Select';

const options = [
    { value: 'a', label: 'Alpha' },
    { value: 'b', label: 'Beta' },
    { value: 'c', label: 'Gamma' },
];

const draw = (value = 'b') => {
    const onChange = vi.fn();
    const rendered = renderWithState(
        <div>
            <Select aria-label="Metric" value={value} options={options} onChange={onChange} />
            <p>Outside</p>
        </div>
    );
    const combobox = rendered.getByRole('combobox', { name: 'Metric' });
    return { ...rendered, onChange, combobox };
};

const optionTexts = (list: HTMLElement) =>
    Array.from(list.querySelectorAll('[role="option"]'), option => ({
        text: option.textContent,
        selected: option.getAttribute('aria-selected'),
    }));

describe('Select', () => {
    it('shows the label of the value and opens its options as listbox on click', () => {
        const { combobox, getByRole, queryByRole } = draw();

        expect(combobox.textContent).toBe('Beta');
        expect(combobox.getAttribute('aria-expanded')).toBe('false');
        expect(queryByRole('listbox')).toBeNull();

        fireEvent.click(combobox);
        const list = getByRole('listbox', { name: 'Metric' });
        expect(combobox.getAttribute('aria-expanded')).toBe('true');
        expect(combobox.getAttribute('aria-controls')).toBe(list.id);
        expect(optionTexts(list)).toEqual([
            { text: 'Alpha', selected: 'false' },
            { text: 'Beta', selected: 'true' },
            { text: 'Gamma', selected: 'false' },
        ]);
    });

    it('reports another option on click and closes; the same option closes only', () => {
        const { combobox, getByRole, queryByRole, onChange } = draw();

        fireEvent.click(combobox);
        fireEvent.click(getByRole('option', { name: 'Beta' }));
        expect(onChange).not.toHaveBeenCalled();
        expect(queryByRole('listbox')).toBeNull();

        fireEvent.click(combobox);
        fireEvent.click(getByRole('option', { name: 'Gamma' }));
        expect(onChange).toHaveBeenCalledWith('c');
        expect(queryByRole('listbox')).toBeNull();
    });

    it('moves through the open list with the arrows and chooses with Enter', () => {
        const { combobox, getByRole, queryByRole, onChange } = draw();

        fireEvent.keyDown(combobox, { key: 'Enter' });
        expect(getByRole('listbox')).toBeTruthy();
        expect(combobox.getAttribute('aria-activedescendant')).toBe(
            getByRole('option', { name: 'Beta' }).id
        );

        fireEvent.keyDown(combobox, { key: 'ArrowDown' });
        // The last option stays active.
        fireEvent.keyDown(combobox, { key: 'ArrowDown' });
        expect(combobox.getAttribute('aria-activedescendant')).toBe(
            getByRole('option', { name: 'Gamma' }).id
        );
        fireEvent.keyDown(combobox, { key: 'Home' });
        expect(combobox.getAttribute('aria-activedescendant')).toBe(
            getByRole('option', { name: 'Alpha' }).id
        );
        fireEvent.keyDown(combobox, { key: 'Enter' });
        expect(onChange).toHaveBeenCalledWith('a');
        expect(queryByRole('listbox')).toBeNull();
    });

    it('opens with Space and closes with Escape without a change', () => {
        const { combobox, getByRole, queryByRole, onChange } = draw();

        fireEvent.keyDown(combobox, { key: ' ' });
        expect(getByRole('listbox')).toBeTruthy();
        fireEvent.keyDown(combobox, { key: 'ArrowUp' });
        fireEvent.keyDown(combobox, { key: 'Escape' });
        expect(queryByRole('listbox')).toBeNull();
        expect(onChange).not.toHaveBeenCalled();
    });

    it('changes the value with the arrows while closed, as mat-select does', () => {
        const { combobox, queryByRole, onChange } = draw();

        fireEvent.keyDown(combobox, { key: 'ArrowDown' });
        expect(onChange).toHaveBeenLastCalledWith('c');
        fireEvent.keyDown(combobox, { key: 'ArrowUp' });
        expect(onChange).toHaveBeenLastCalledWith('a');
        expect(queryByRole('listbox')).toBeNull();
    });

    it('stays at the ends while closed', () => {
        const { combobox, onChange } = draw('c');

        fireEvent.keyDown(combobox, { key: 'ArrowDown' });
        expect(onChange).not.toHaveBeenCalled();
    });

    it('closes on a press outside, not on one inside', () => {
        const { combobox, getByRole, getByText, queryByRole } = draw();

        fireEvent.click(combobox);
        fireEvent.pointerDown(getByRole('option', { name: 'Alpha' }));
        expect(getByRole('listbox')).toBeTruthy();

        fireEvent.pointerDown(getByText('Outside'));
        expect(queryByRole('listbox')).toBeNull();
    });
});
