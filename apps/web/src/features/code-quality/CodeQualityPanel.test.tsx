import { analyzeProject } from '@qualivis/core';
import { act } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { analysisAtom, initialAnalysisState } from '../../state/analysisAtoms';
import type { NodeSelection } from '../../state/selection';
import { selectFileAtom, selectionAtom } from '../../state/selectionAtoms';
import { loadFixture } from '../../test/fixtures';
import { renderWithState } from '../../test/renderWithState';
import { initial } from '../../test/TestProvider';
import { CodeQualityPanel } from './CodeQualityPanel';

const mini = analyzeProject(loadFixture('mini'));
const done = initial(analysisAtom, { ...initialAnalysisState, status: 'done', result: mini });

const report = {
    cyclomatic: 3,
    paramCount: 0,
    sloc: { physical: 34, logical: 20 },
    halstead: { difficulty: 34.286, bugs: 0.373 },
};

const renderFunction: NodeSelection = {
    id: 'render',
    label: 'render',
    type: 'innerFunction',
    report,
    icons: [
        {
            icon: 'warning',
            class: 'warn',
            description: { text: 'This function almost exceeds at least one metric threshold.' },
        },
        {
            icon: 'device_hub',
            class: 'error',
            description: {
                text: 'Inheritance should be avoided',
                link: { href: 'https://reactjs.org/docs/composition-vs-inheritance.html' },
            },
        },
    ],
};

/** Width of the fill of a meter (the bar of a metric). */
const fillWidth = (meter: HTMLElement | undefined) =>
    meter?.querySelector<HTMLElement>('div')?.style.width;

const drawPanel = (selection: NodeSelection[] | null) =>
    renderWithState(<CodeQualityPanel />, {
        initialValues: [done, initial(selectionAtom, selection)],
    });

describe('CodeQualityPanel', () => {
    beforeEach(() => {
        vi.spyOn(console, 'log').mockImplementation(() => {});
        vi.spyOn(console, 'error').mockImplementation(() => {});
    });
    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('shows only the heading without a selection', () => {
        const { getByRole, queryAllByRole } = drawPanel(null);

        expect(getByRole('heading').textContent).toBe('Code Quality');
        expect(queryAllByRole('meter')).toHaveLength(0);
    });

    it('shows name, metric bars with tooltips and the icon hints of the first selection', () => {
        const { getByRole, getAllByRole, getByText } = drawPanel([
            renderFunction,
            { ...renderFunction, id: 'other', label: 'other' },
        ]);

        expect(getByRole('heading').textContent).toBe('Code Quality render');
        const meters = getAllByRole('meter');
        // innerFunction: no thresholds for the two JSX metrics.
        expect(meters.map(meter => meter.getAttribute('aria-label'))).toEqual([
            'Lines of Code',
            'Cyclomatic Complexity',
            'Halstead Difficulty',
            'Halstead Bugs',
            'Parameter Count',
        ]);
        // render: 60 lines; 34 / 60 is below 80 %.
        const lines = meters[0];
        expect(lines?.getAttribute('aria-valuenow')).toBe('34');
        expect(lines?.getAttribute('aria-valuemax')).toBe('60');
        expect(fillWidth(lines)).toBe(`${(34 / 60) * 100}%`);
        expect(lines?.parentElement?.getAttribute('data-level')).toBe('ok');
        expect(getByText('Lines of Code').getAttribute('title')).toBe(
            'The number of lines of code including comments.'
        );
        // The value as the report has it, with value/threshold as tooltip.
        const difficulty = getByText('34.286');
        // render has its own thresholds: difficulty 22.5, so 34.286 is over it.
        expect(difficulty.getAttribute('title')).toBe('34.286/22.5');
        expect(meters[2]?.parentElement?.getAttribute('data-level')).toBe('error');

        expect(getByText(/almost exceeds/).textContent).toBe(
            'This function almost exceeds at least one metric threshold.'
        );
        const link = getByRole('link');
        expect(link.getAttribute('href')).toBe(
            'https://reactjs.org/docs/composition-vs-inheritance.html'
        );
        expect(link.getAttribute('target')).toBe('_blank');
        expect(link.getAttribute('rel')).toBe('noopener noreferrer');
        expect(link.parentElement?.textContent).toBe(
            'Inheritance should be avoided (see https://reactjs.org/docs/composition-vs-inheritance.html)'
        );
        expect(console.log).toHaveBeenCalledWith('Report', report);
    });

    it('caps the bar at 100 % and colours it by the threshold', () => {
        const { getAllByRole } = drawPanel([
            {
                ...renderFunction,
                report: { ...report, cyclomatic: 10, paramCount: 25 },
                icons: [],
            },
        ]);
        const meters = getAllByRole('meter');

        // render: cyclomatic 10 / 12 = 0.83 → warn, paramCount 25 / 1 → error and full
        expect(meters[1]?.parentElement?.getAttribute('data-level')).toBe('warn');
        expect(meters[4]?.parentElement?.getAttribute('data-level')).toBe('error');
        expect(fillWidth(meters[4])).toBe('100%');
    });

    it('adds "(aggregate)" for the aggregate report of a class component', () => {
        const { getByRole } = drawPanel([
            { id: '/a.js#A', label: 'A', type: 'component', report: { aggregate: report } },
        ]);

        expect(getByRole('heading').textContent).toBe('Code Quality A (aggregate)');
    });

    it('shows a file selected in the file tree with the icons of its node (ADR-011 A9)', () => {
        const { getByText, store } = drawPanel(null);

        act(() => store.set(selectFileAtom, '/mini/src/components/Header.js'));

        expect(getByText('device_hub')).toBeTruthy();
        expect(getByText(/composition-vs-inheritance/)).toBeTruthy();
    });

    it('updates when the selection changes', () => {
        const { getByRole, store } = drawPanel([renderFunction]);

        act(() =>
            store.set(selectionAtom, [{ ...renderFunction, id: 'x', label: 'componentDidMount' }])
        );

        expect(getByRole('heading').textContent).toBe('Code Quality componentDidMount');
    });
});
