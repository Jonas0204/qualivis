import { analyzeProject } from '@qualivis/core';
import { act, fireEvent } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { GraphView } from '../features/graph/GraphView';
import type { LayoutFactory } from '../features/graph/layout/createLayout';
import { analysisAtom, initialAnalysisState } from '../state/analysisAtoms';
import { componentIdAtom } from '../state/viewAtoms';
import { loadFixture } from '../test/fixtures';
import { renderHookWithState, renderWithState } from '../test/renderWithState';
import { initial } from '../test/TestProvider';
import { useUrlState } from './useUrlState';

const mini = analyzeProject(loadFixture('mini'));
const done = initial(analysisAtom, { ...initialAnalysisState, status: 'done', result: mini });
const app = '/mini/src/App.js#App';
const encodedApp = '%2Fmini%2Fsrc%2FApp.js%23App';

/** Sets the URL like the browser does on back and forward, and tells the page. */
const goTo = (search: string) =>
    act(() => {
        window.history.replaceState(null, '', `/qualivis/${search}`);
        window.dispatchEvent(new PopStateEvent('popstate'));
    });

const drawHook = () => renderHookWithState(() => useUrlState(), { initialValues: [done] });

describe('useUrlState', () => {
    beforeEach(() => {
        window.history.replaceState(null, '', '/qualivis/');
        vi.spyOn(console, 'log').mockImplementation(() => {});
        vi.spyOn(console, 'error').mockImplementation(() => {});
    });
    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('adds ?id= (encoded) for a component view as a new history entry and keeps the path', () => {
        const { store } = drawHook();
        const length = window.history.length;

        act(() => store.set(componentIdAtom, app));

        expect(window.location.pathname).toBe('/qualivis/');
        expect(window.location.search).toBe(`?id=${encodedApp}`);
        expect(window.location.hash).toBe('');
        expect(window.history.length).toBe(length + 1);

        act(() => store.set(componentIdAtom, undefined));
        expect(window.location.search).toBe('');
        expect(window.history.length).toBe(length + 2);
    });

    it('follows the URL on back and forward', () => {
        const { store } = drawHook();

        goTo(`?id=${encodedApp}`);
        expect(store.get(componentIdAtom)).toBe(app);

        goTo('');
        expect(store.get(componentIdAtom)).toBeUndefined();
        expect(window.location.search).toBe('');
    });

    it('opens the component view of the URL at the start', () => {
        window.history.replaceState(null, '', `/qualivis/?id=${encodedApp}`);
        const length = window.history.length;

        const { store } = drawHook();

        expect(store.get(componentIdAtom)).toBe(app);
        expect(window.location.search).toBe(`?id=${encodedApp}`);
        expect(window.history.length).toBe(length);
    });

    it('shows the app view for an unknown id and removes it from the URL without a new entry', () => {
        window.history.replaceState(null, '', '/qualivis/?id=%2Fmini%2Fsrc%2FNope.js%23Nope');
        const length = window.history.length;

        const { store } = drawHook();

        expect(store.get(componentIdAtom)).toBeUndefined();
        expect(window.location.search).toBe('');
        expect(window.history.length).toBe(length);
    });

    it('leaves the URL and the history for a view change to an id without a graph', () => {
        const { store } = drawHook();
        window.history.replaceState({ view: 'app' }, '', '/qualivis/');
        const length = window.history.length;

        act(() => store.set(componentIdAtom, '/mini/src/Nope.js#Nope'));

        expect(store.get(componentIdAtom)).toBeUndefined();
        expect(window.location.search).toBe('');
        expect(window.history.state).toEqual({ view: 'app' });
        expect(window.history.length).toBe(length);
    });

    it('still writes the next view change after a back or forward that keeps the id', () => {
        const { store } = drawHook();

        goTo('');
        act(() => store.set(componentIdAtom, app));

        expect(window.location.search).toBe(`?id=${encodedApp}`);
    });

    it('keeps an id without an analysis, for the analysis to come (P07-S05)', () => {
        window.history.replaceState(null, '', `/qualivis/?id=${encodedApp}`);

        const { store } = renderHookWithState(() => useUrlState());

        expect(store.get(componentIdAtom)).toBe(app);
        expect(window.location.search).toBe(`?id=${encodedApp}`);
    });
});

/** Fake engine: puts the nodes in a row at once and reports the end. */
const createLayout: LayoutFactory = (_flowLayout, { nodes }) => {
    const ends = new Set<() => void>();
    return {
        start: () => {
            nodes.forEach((node, index) => {
                node.x = index * 100;
                node.y = 0;
            });
            for (const end of ends) {
                end();
            }
        },
        stop: () => {},
        halt: () => {},
        onTick: () => () => undefined,
        onEnd: listener => {
            ends.add(listener);
            return () => ends.delete(listener);
        },
        drag: () => {},
        dragEnd: () => {},
    };
};

const measure = {
    bounds: () => ({ x: 0, y: 0, width: 100, height: 100 }),
    viewport: () => ({ width: 400, height: 300 }),
};

const GraphWithUrl = () => {
    useUrlState();
    return <GraphView createLayout={createLayout} measure={measure} />;
};

describe('component view over the URL', () => {
    beforeEach(() => {
        window.history.replaceState(null, '', '/qualivis/');
        vi.useFakeTimers({ toFake: ['requestAnimationFrame', 'cancelAnimationFrame'] });
        vi.spyOn(console, 'log').mockImplementation(() => {});
        vi.spyOn(console, 'error').mockImplementation(() => {});
    });
    afterEach(() => {
        vi.useRealTimers();
        vi.restoreAllMocks();
    });

    it('opens on a double click, goes back with the back button and the browser (G3, N13)', () => {
        const { container, getByRole, store } = renderWithState(<GraphWithUrl />, {
            initialValues: [done],
        });
        const appNode = Array.from(container.querySelectorAll('g.node')).find(
            node => node.querySelector('.label-text')?.textContent === 'App'
        );
        if (!appNode) {
            throw new Error('no App node');
        }

        fireEvent.doubleClick(appNode);
        expect(window.location.search).toBe(`?id=${encodedApp}`);

        fireEvent.click(getByRole('button', { name: 'Back to app graph' }));
        expect(window.location.search).toBe('');
        expect(store.get(componentIdAtom)).toBeUndefined();

        goTo(`?id=${encodedApp}`);
        expect(getByRole('button', { name: 'Back to app graph' })).toBeTruthy();
    });

    it('resets a component-only size metric when the URL opens a component view (N11)', async () => {
        const { getByRole, findByRole } = renderWithState(<GraphWithUrl />, {
            initialValues: [done],
        });
        const select = () => getByRole('combobox', { name: 'Node size metric' });
        fireEvent.click(select());
        fireEvent.click(await findByRole('option', { name: 'Lines of JSX Code' }));
        expect(select().textContent).toBe('Lines of JSX Code');

        goTo(`?id=${encodedApp}`);

        expect(select().textContent).toBe('Lines of Code');
    });
});
