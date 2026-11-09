import { act, fireEvent } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { renderWithState } from '../test/renderWithState';
import { Button } from './Button';
import { Tooltip, tooltipShowDelay } from './Tooltip';

const draw = (onPointerEnter = vi.fn()) =>
    renderWithState(
        <Tooltip text="Zoom to 100%">
            <Button aria-label="Zoom to 100%" onPointerEnter={onPointerEnter}>
                100%
            </Button>
        </Tooltip>
    );

const wait = (ms: number) =>
    act(() => {
        vi.advanceTimersByTime(ms);
    });

describe('Tooltip', () => {
    beforeEach(() => {
        vi.useFakeTimers();
    });
    afterEach(() => {
        vi.useRealTimers();
    });

    it('shows the text below the element after hovering 500 ms and hides it on leave', () => {
        const onPointerEnter = vi.fn();
        const { getByRole, queryByRole } = draw(onPointerEnter);
        const button = getByRole('button', { name: 'Zoom to 100%' });

        fireEvent.pointerEnter(button, { pointerType: 'mouse' });
        wait(tooltipShowDelay - 1);
        expect(queryByRole('tooltip')).toBeNull();
        wait(1);
        expect(getByRole('tooltip').textContent).toBe('Zoom to 100%');
        // The handler of the element still runs.
        expect(onPointerEnter).toHaveBeenCalledTimes(1);

        fireEvent.pointerLeave(button, { pointerType: 'mouse' });
        expect(queryByRole('tooltip')).toBeNull();
    });

    it('describes the element with its text', () => {
        const { getByRole } = draw();

        const button = getByRole('button', { name: 'Zoom to 100%' });
        const id = button.getAttribute('aria-describedby');
        expect(id).toBeTruthy();
        expect(document.getElementById(id ?? '')?.textContent).toBe('Zoom to 100%');
    });

    it('shows on keyboard focus and hides on Escape and blur', () => {
        const { getByRole, queryByRole } = draw();
        const button = getByRole('button', { name: 'Zoom to 100%' });

        fireEvent.focus(button);
        wait(tooltipShowDelay);
        expect(getByRole('tooltip')).toBeTruthy();
        fireEvent.keyDown(button, { key: 'Escape' });
        expect(queryByRole('tooltip')).toBeNull();

        fireEvent.blur(button);
        fireEvent.focus(button);
        wait(tooltipShowDelay);
        expect(getByRole('tooltip')).toBeTruthy();
        fireEvent.blur(button);
        expect(queryByRole('tooltip')).toBeNull();
    });

    it('hides when pressed and does not show on the focus of the press or on touch', () => {
        const { getByRole, queryByRole } = draw();
        const button = getByRole('button', { name: 'Zoom to 100%' });

        fireEvent.pointerEnter(button, { pointerType: 'mouse' });
        wait(tooltipShowDelay);
        fireEvent.pointerDown(button, { pointerType: 'mouse' });
        fireEvent.focus(button);
        wait(tooltipShowDelay);
        expect(queryByRole('tooltip')).toBeNull();

        fireEvent.pointerLeave(button, { pointerType: 'mouse' });
        fireEvent.pointerEnter(button, { pointerType: 'touch' });
        wait(tooltipShowDelay);
        expect(queryByRole('tooltip')).toBeNull();
    });

    it('does not show when the pointer leaves before the delay', () => {
        const { getByRole, queryByRole } = draw();
        const button = getByRole('button', { name: 'Zoom to 100%' });

        fireEvent.pointerEnter(button, { pointerType: 'mouse' });
        wait(tooltipShowDelay / 2);
        fireEvent.pointerLeave(button, { pointerType: 'mouse' });
        wait(tooltipShowDelay);
        expect(queryByRole('tooltip')).toBeNull();
    });
});
