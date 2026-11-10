import { fireEvent, render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { type SplitArea, SplitPane } from './SplitPane';

const columns = (visible = true): SplitArea[] => [
    { key: 'left', size: 275, visible, label: 'file tree', children: 'Left' },
    { key: 'middle', size: '*', children: 'Middle' },
    { key: 'right', size: 575, visible, label: 'side panels', children: 'Right' },
];

const draw = (areas: SplitArea[], direction: 'horizontal' | 'vertical' = 'horizontal') =>
    render(<SplitPane direction={direction} areas={areas} />);

const area = (container: HTMLElement, key: string) =>
    container.querySelector<HTMLElement>(`[data-area="${key}"]`);

/** jsdom has no layout: give the area the extent the browser would. */
const giveExtent = (element: HTMLElement | null, extent: number) => {
    Object.defineProperty(element, 'clientWidth', { configurable: true, value: extent });
    Object.defineProperty(element, 'clientHeight', { configurable: true, value: extent });
};

describe('SplitPane', () => {
    it('sets the pixel sizes as styles and lets the * area take the rest', () => {
        const { container, getAllByRole } = draw(columns());

        expect(area(container, 'left')?.style.flexBasis).toBe('275px');
        expect(area(container, 'right')?.style.flexBasis).toBe('575px');
        expect(area(container, 'middle')?.style.flexBasis).toBe('');
        expect(area(container, 'middle')?.textContent).toBe('Middle');

        const gutters = getAllByRole('separator');
        expect(gutters).toHaveLength(2);
        expect(gutters[0]?.style.width).toBe('8px');
        expect(gutters[0]?.getAttribute('aria-orientation')).toBe('vertical');
        expect(gutters[0]?.getAttribute('aria-label')).toBe('Resize file tree');
    });

    it('moves a gutter with the pointer: +50 px grows the left area by 50 and shrinks the * area', () => {
        const { container, getByRole } = draw(columns());
        giveExtent(area(container, 'middle'), 600);
        const gutter = getByRole('separator', { name: 'Resize file tree' });

        fireEvent.pointerDown(gutter, { pointerId: 1, button: 0, clientX: 280 });
        fireEvent.pointerMove(gutter, { pointerId: 1, clientX: 300 });
        fireEvent.pointerMove(gutter, { pointerId: 1, clientX: 330 });
        fireEvent.pointerUp(gutter, { pointerId: 1, clientX: 330 });

        expect(area(container, 'left')?.style.flexBasis).toBe('325px');
        // The * area keeps flex 1 and gets what is left; the right area stays.
        expect(area(container, 'middle')?.style.flexBasis).toBe('');
        expect(area(container, 'right')?.style.flexBasis).toBe('575px');
        expect(gutter.getAttribute('aria-valuenow')).toBe('325');

        // Moves after the pointer is up change nothing.
        fireEvent.pointerMove(gutter, { pointerId: 1, clientX: 400 });
        expect(area(container, 'left')?.style.flexBasis).toBe('325px');
    });

    it('shrinks the right area when its gutter moves to the right, not below 0', () => {
        const { container, getByRole } = draw(columns());
        giveExtent(area(container, 'middle'), 600);
        const gutter = getByRole('separator', { name: 'Resize side panels' });

        fireEvent.pointerDown(gutter, { pointerId: 1, button: 0, clientX: 900 });
        fireEvent.pointerMove(gutter, { pointerId: 1, clientX: 950 });
        expect(area(container, 'right')?.style.flexBasis).toBe('525px');

        fireEvent.pointerMove(gutter, { pointerId: 1, clientX: 2000 });
        expect(area(container, 'right')?.style.flexBasis).toBe('0px');
    });

    it('does not let the left area grow past the * area', () => {
        const { container, getByRole } = draw(columns());
        giveExtent(area(container, 'middle'), 100);
        const gutter = getByRole('separator', { name: 'Resize file tree' });

        fireEvent.pointerDown(gutter, { pointerId: 1, button: 0, clientX: 280 });
        fireEvent.pointerMove(gutter, { pointerId: 1, clientX: 600 });

        expect(area(container, 'left')?.style.flexBasis).toBe('375px');
    });

    it('moves a focused gutter by 10 px per arrow key', () => {
        const { container, getAllByRole } = draw(
            [
                { key: 'top', size: 363, label: 'code quality', children: 'Top' },
                { key: 'bottom', size: '*', children: 'Bottom' },
            ],
            'vertical'
        );
        giveExtent(area(container, 'bottom'), 400);
        const [gutter] = getAllByRole('separator');
        if (!gutter) {
            throw new Error('no gutter');
        }
        expect(gutter.style.height).toBe('8px');
        expect(gutter.getAttribute('aria-orientation')).toBe('horizontal');

        fireEvent.keyDown(gutter, { key: 'ArrowDown' });
        expect(area(container, 'top')?.style.flexBasis).toBe('373px');
        fireEvent.keyDown(gutter, { key: 'ArrowUp' });
        fireEvent.keyDown(gutter, { key: 'ArrowUp' });
        expect(area(container, 'top')?.style.flexBasis).toBe('353px');
        // Left and right do nothing in a vertical split.
        fireEvent.keyDown(gutter, { key: 'ArrowRight' });
        expect(area(container, 'top')?.style.flexBasis).toBe('353px');
    });

    it('gives hidden areas size 0 without gutters and keeps their content mounted', () => {
        const { container, queryAllByRole, rerender } = draw(columns(false));

        expect(queryAllByRole('separator')).toHaveLength(0);
        for (const key of ['left', 'right']) {
            const hidden = area(container, key);
            expect(hidden?.style.flexBasis).toBe('');
            expect(hidden?.className).toMatch(/hidden/);
            expect(hidden?.textContent).toBeTruthy();
        }

        rerender(<SplitPane direction="horizontal" areas={columns(true)} />);
        expect(queryAllByRole('separator')).toHaveLength(2);
        expect(area(container, 'left')?.style.flexBasis).toBe('275px');
    });
});
