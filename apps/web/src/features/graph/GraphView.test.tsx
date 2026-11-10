import { analyzeProject, defaultSettings, type Settings } from '@qualivis/core';
import { act, fireEvent } from '@testing-library/react';
import { StrictMode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { analysisAtom, initialAnalysisState } from '../../state/analysisAtoms';
import { selectionAtom } from '../../state/selectionAtoms';
import { componentIdAtom, fullScreenAtom } from '../../state/viewAtoms';
import { loadFixture } from '../../test/fixtures';
import { renderWithState } from '../../test/renderWithState';
import { initial } from '../../test/TestProvider';
import { GraphView } from './GraphView';
import type { LayoutFactory, LayoutOptions } from './layout/createLayout';
import type { LayoutEngine } from './layout/types';
import type { LabelMeasure } from './useLabelCollision';
import type { PanZoomMeasure } from './usePanZoom';

const mini = analyzeProject(loadFixture('mini'));
const done = initial(analysisAtom, { ...initialAnalysisState, status: 'done', result: mini });

type FakeEngine = {
    colaLayout: boolean;
    options: LayoutOptions;
    stopped: boolean;
    calls: string[];
    /** Reports the end again, as after a drag. */
    end: () => void;
    /** Where the nodes were when the engine was built. */
    positions: { id: string; x?: number; y?: number }[];
};

/** Fake engine: puts the nodes in a row at once and reports the end, without animation. */
const createFakeLayout = () => {
    const engines: FakeEngine[] = [];
    const createLayout: LayoutFactory = (colaLayout, options) => {
        const { nodes } = options;
        const endListeners = new Set<() => void>();
        const end = () => {
            for (const listener of endListeners) {
                listener();
            }
        };
        const record: FakeEngine = {
            colaLayout,
            options,
            stopped: false,
            calls: [],
            end,
            positions: nodes.map(({ id, x, y }) => ({ id, x, y })),
        };
        engines.push(record);
        const engine: LayoutEngine = {
            start: () => {
                nodes.forEach((node, index) => {
                    node.x = index * 100;
                    node.y = 0;
                });
                end();
            },
            stop: () => {
                record.stopped = true;
            },
            halt: () => {
                record.calls.push('halt');
            },
            onTick: () => () => undefined,
            onEnd: listener => {
                endListeners.add(listener);
                return () => endListeners.delete(listener);
            },
            dragStart: node => {
                record.calls.push(`dragStart ${node.id}`);
            },
            drag: (node, { x, y }) => {
                record.calls.push(`drag ${node.id} ${x} ${y}`);
            },
            dragEnd: (node, { pin }) => {
                record.calls.push(`dragEnd ${node.id} ${pin}`);
            },
        };
        return engine;
    };
    return { engines, createLayout };
};

// jsdom has no layout: the graph spans x -30 … 730 (8 nodes 100 apart), the area is 400 × 300.
const measure: PanZoomMeasure = {
    bounds: () => ({ x: -30, y: -30, width: 760, height: 60 }),
    viewport: () => ({ width: 400, height: 300 }),
};

const drawView = (createLayout: LayoutFactory, settings: Settings = defaultSettings) =>
    renderWithState(
        <GraphView createLayout={createLayout} settings={settings} measure={measure} />,
        { initialValues: [done] }
    );

const zoomGroupTransform = (container: HTMLElement) =>
    container.querySelector('g.zoom-group')?.getAttribute('transform');

/** Runs the animation frames of zoom to fit (250 ms). */
const finishZoom = () => {
    act(() => {
        vi.advanceTimersByTime(300);
    });
};

describe('GraphView', () => {
    // The view model logs nodes without a report (K5: ConnectedTodoList); keep the output clean.
    beforeEach(() => {
        vi.spyOn(console, 'error').mockImplementation(() => {});
        vi.useFakeTimers({ toFake: ['requestAnimationFrame', 'cancelAnimationFrame'] });
    });
    afterEach(async () => {
        vi.useRealTimers();
        vi.restoreAllMocks();
        // A pan or drag swallows the next click until the next task (suppressNextClick).
        await new Promise(resolve => setTimeout(resolve, 0));
    });

    it('draws the 8 nodes and 7 links of the mini app graph and fits them in after the layout', () => {
        const { createLayout } = createFakeLayout();
        const { container, getByRole } = drawView(createLayout);

        expect(container.querySelectorAll('g.zoom-group g.node')).toHaveLength(8);
        expect(container.querySelectorAll('g.zoom-group g.links line')).toHaveLength(7);
        finishZoom();
        // k = 0.95 / max(760 / 400, 60 / 300) = 0.5, centre (350, 0) to the middle (200, 150).
        expect(zoomGroupTransform(container)).toBe('translate(25,150) scale(0.5)');
        expect(getByRole('button', { name: 'Zoom to 100%' }).textContent).toBe('50%');
    });

    it('draws the first frame of a running layout with React and moves the graph after that', () => {
        const ticks = new Set<() => void>();
        let layoutNodes: LayoutOptions['nodes'] = [];
        const tick = (x: number) => {
            layoutNodes.forEach((node, index) => {
                node.x = x + index;
                node.y = 0;
            });
            act(() => {
                for (const listener of ticks) {
                    listener();
                }
                vi.advanceTimersByTime(20);
            });
        };
        const createLayout: LayoutFactory = (_cola, options) => {
            layoutNodes = options.nodes;
            return {
                start: () => undefined,
                stop: () => undefined,
                halt: () => undefined,
                onTick: listener => {
                    ticks.add(listener);
                    return () => ticks.delete(listener);
                },
                onEnd: () => () => undefined,
                dragStart: () => undefined,
                drag: () => undefined,
                dragEnd: () => undefined,
            };
        };
        const { container } = drawView(createLayout);
        const firstTransform = () =>
            container.querySelector('g.zoom-group g.node')?.getAttribute('transform');

        expect(container.querySelectorAll('g.zoom-group g.node')).toHaveLength(0);
        tick(10);
        expect(container.querySelectorAll('g.zoom-group g.node')).toHaveLength(8);
        expect(firstTransform()).toBe('translate(10, 0)');

        tick(500);
        expect(firstTransform()).toBe('translate(500, 0)');
        expect(container.querySelector('g.zoom-group g.links line')?.getAttribute('x1')).not.toBe(
            null
        );
    });

    it('stops a running layout with the stop button and fits the graph in', () => {
        const ticks = new Set<() => void>();
        const ends = new Set<() => void>();
        const notify = (listeners: Set<() => void>) => {
            act(() => {
                for (const listener of listeners) {
                    listener();
                }
                vi.advanceTimersByTime(20);
            });
        };
        const halt = vi.fn(() => notify(ends));
        const createLayout: LayoutFactory = (_cola, { nodes }) => ({
            start: () => {
                nodes.forEach((node, index) => {
                    node.x = index * 100;
                    node.y = 0;
                });
            },
            stop: () => undefined,
            halt,
            onTick: listener => {
                ticks.add(listener);
                return () => ticks.delete(listener);
            },
            onEnd: listener => {
                ends.add(listener);
                return () => ends.delete(listener);
            },
            dragStart: () => undefined,
            drag: () => undefined,
            dragEnd: () => undefined,
        });
        const { container, getByRole, queryByRole } = drawView(createLayout);
        expect(queryByRole('button', { name: 'Stop layout' })).toBeNull();

        notify(ticks);
        fireEvent.click(getByRole('button', { name: 'Stop layout' }));
        finishZoom();

        expect(halt).toHaveBeenCalledTimes(1);
        expect(queryByRole('button', { name: 'Stop layout' })).toBeNull();
        expect(zoomGroupTransform(container)).toBe('translate(25,150) scale(0.5)');
    });

    it('zooms to 100 %, centred on the graph, and back to fit with the buttons', () => {
        const { createLayout } = createFakeLayout();
        const { container, getByRole } = drawView(createLayout);
        finishZoom();

        fireEvent.click(getByRole('button', { name: 'Zoom to 100%' }));
        finishZoom();
        expect(zoomGroupTransform(container)).toBe('translate(-150,150) scale(1)');
        expect(getByRole('button', { name: 'Zoom to 100%' }).textContent).toBe('100%');

        fireEvent.click(getByRole('button', { name: 'Zoom to fit' }));
        finishZoom();
        expect(zoomGroupTransform(container)).toBe('translate(25,150) scale(0.5)');
    });

    it('fits in only after the first end of a layout run', () => {
        const { createLayout, engines } = createFakeLayout();
        const { container, getByRole, rerender } = drawView(createLayout);
        finishZoom();
        fireEvent.click(getByRole('button', { name: 'Zoom to 100%' }));
        finishZoom();

        // A later end, e.g. after dragging, leaves the zoom alone.
        act(() => engines[0]?.end());
        finishZoom();
        expect(zoomGroupTransform(container)).toBe('translate(-150,150) scale(1)');

        // A restart (here: the other engine) fits in again.
        rerender(
            <GraphView
                createLayout={createLayout}
                settings={{ ...defaultSettings, colaLayout: false }}
                measure={measure}
            />
        );
        finishZoom();
        expect(zoomGroupTransform(container)).toBe('translate(25,150) scale(0.5)');
    });

    it('leaves the zoom alone without "Auto zoom"', () => {
        const { createLayout } = createFakeLayout();
        const { container } = drawView(createLayout, { ...defaultSettings, autoZoom: false });
        finishZoom();

        expect(zoomGroupTransform(container)).toBe('translate(0,0) scale(1)');
    });

    it('caps label size and link width when zooming in and keeps them when zooming out (V5)', () => {
        const { createLayout } = createFakeLayout();
        const settings = { ...defaultSettings, autoZoom: false };
        const { container, getByRole, rerender } = drawView(createLayout, settings);
        const svg = getByRole('img', { name: 'Component graph' });
        // The zoom group passes them on as CSS variables (graph.css).
        const zoomGroupStyle = () => container.querySelector<SVGGElement>('g.zoom-group')?.style;
        const labelStyle = () => zoomGroupStyle()?.getPropertyValue('--qv-label-font-size');
        const linkStyle = () => zoomGroupStyle()?.getPropertyValue('--qv-link-stroke-width');

        // 2 ** (600 * 0.002) = 2.297…: labels 20 / k px, links 1.6 / k.
        // The wheel transition eases them for 100 ms (useZoomTransition).
        fireEvent.wheel(svg, { deltaY: -600, deltaMode: 0 });
        finishZoom();
        const k = 2 ** 1.2;
        expect(labelStyle()).toBe(`${20 / k}px`);
        expect(linkStyle()).toBe(`${1.6 / k}`);

        fireEvent.wheel(svg, { deltaY: 600, deltaMode: 0 });
        finishZoom();
        expect(getByRole('button', { name: 'Zoom to 100%' }).textContent).toBe('100%');
        expect(labelStyle()).toBe(`${20 / k}px`);
        expect(linkStyle()).toBe(`${1.6 / k}`);

        // A restart draws the labels and links with the default sizes again.
        rerender(
            <GraphView
                createLayout={createLayout}
                settings={{ ...settings, nodeSizesBasedOnMetrics: false }}
                measure={measure}
            />
        );
        expect(labelStyle()).toBe('14px');
        expect(linkStyle()).toBe('0.8');
    });

    it('pans when dragging the background and drags a node without panning', () => {
        const { createLayout, engines } = createFakeLayout();
        const { container, getByRole } = drawView(createLayout, {
            ...defaultSettings,
            autoZoom: false,
        });
        const svg = getByRole('img', { name: 'Component graph' });

        fireEvent.pointerDown(svg, { pointerId: 1, clientX: 100, clientY: 100 });
        fireEvent.pointerMove(window, { pointerId: 1, clientX: 130, clientY: 90 });
        fireEvent.pointerUp(window, { pointerId: 1, clientX: 130, clientY: 90 });
        expect(zoomGroupTransform(container)).toBe('translate(30,-10) scale(1)');

        // The second node sits at (100, 0), on screen at (130, -10).
        const node = container.querySelectorAll('g.node')[1];
        if (!node) {
            throw new Error('no second node');
        }
        fireEvent.pointerDown(node, { pointerId: 2, clientX: 130, clientY: -10 });
        fireEvent.pointerMove(window, { pointerId: 2, clientX: 150, clientY: 20 });
        fireEvent.pointerUp(window, { pointerId: 2, clientX: 150, clientY: 20, shiftKey: true });

        const id = engines[0]?.options.nodes[1]?.id;
        expect(engines[0]?.calls).toEqual([
            `dragStart ${id}`,
            `drag ${id} 120 30`,
            `dragEnd ${id} true`,
        ]);
        expect(zoomGroupTransform(container)).toBe('translate(30,-10) scale(1)');
    });

    it('sizes the nodes by their lines of code', () => {
        const { createLayout } = createFakeLayout();
        const { container } = drawView(createLayout);

        const radius = (label: string) =>
            Array.from(container.querySelectorAll('g.node'))
                .find(node => node.querySelector('.label-text')?.textContent === label)
                ?.querySelector('circle.circle-node')
                ?.getAttribute('r');
        // App: width 54.68… from the golden of the legacy app view, minus the preview ring of 14.
        expect(Number(radius('App'))).toBeCloseTo((54.68428945128219 - 14) / 2, 9);
        // Legacy quirk K5: ConnectedTodoList has no report, so it is 20 wide (main radius 3).
        expect(radius('ConnectedTodoList')).toBe('3');
    });

    it('lays out a copy, so the analysis result keeps no positions', () => {
        const { createLayout } = createFakeLayout();
        drawView(createLayout);

        expect(mini.appGraph.nodes.every(node => node.x === undefined)).toBe(true);
        expect(mini.appGraph.nodes.every(node => node.width === undefined)).toBe(true);
    });

    it('draws nothing before an analysis result exists', () => {
        const { createLayout, engines } = createFakeLayout();
        const { container } = renderWithState(
            <GraphView createLayout={createLayout} measure={measure} />
        );

        expect(container.querySelector('svg')).toBeNull();
        expect(container.querySelector('button')).toBeNull();
        expect(engines).toHaveLength(0);
    });

    it('leaves no engine running in StrictMode and after unmount', () => {
        const { createLayout, engines } = createFakeLayout();
        const { unmount } = renderWithState(
            <StrictMode>
                <GraphView createLayout={createLayout} measure={measure} />
            </StrictMode>,
            { initialValues: [done] }
        );

        expect(engines.filter(engine => !engine.stopped)).toHaveLength(1);
        unmount();
        expect(engines.every(engine => engine.stopped)).toBe(true);
    });

    it('lays out with WebCola by default, without constraints in the app view', () => {
        const { createLayout, engines } = createFakeLayout();
        drawView(createLayout);

        expect(engines).toHaveLength(1);
        expect(engines[0]?.colaLayout).toBe(true);
        expect(engines[0]?.options.constraints).toEqual([]);
        expect(engines[0]?.options.nodes).toHaveLength(8);
        expect(engines[0]?.options.links).toHaveLength(7);
    });

    it('switches the engine without a reload and stops the old one', () => {
        const { createLayout, engines } = createFakeLayout();
        const { container, rerender } = drawView(createLayout);

        rerender(
            <GraphView
                createLayout={createLayout}
                settings={{ ...defaultSettings, colaLayout: false }}
                measure={measure}
            />
        );

        expect(engines.map(({ colaLayout, stopped }) => ({ colaLayout, stopped }))).toEqual([
            { colaLayout: true, stopped: true },
            { colaLayout: false, stopped: false },
        ]);
        // The same view model: the new engine starts from the positions of the old one.
        expect(engines[1]?.options.nodes).toBe(engines[0]?.options.nodes);
        expect(container.querySelectorAll('g.node')).toHaveLength(8);
    });

    it('builds a new view model and engine when the node sizes setting changes', () => {
        const { createLayout, engines } = createFakeLayout();
        const { rerender } = drawView(createLayout);

        rerender(
            <GraphView
                createLayout={createLayout}
                settings={{ ...defaultSettings, nodeSizesBasedOnMetrics: false }}
                measure={measure}
            />
        );

        expect(engines).toHaveLength(2);
        expect(engines[0]?.stopped).toBe(true);
        expect(engines[1]?.options.nodes).not.toBe(engines[0]?.options.nodes);
        // Without sizes by metric every node is 48 wide (2 × circleRadius), as in the legacy app.
        expect(engines[1]?.options.nodes.every(node => node.width === 48)).toBe(true);
    });
});

const app = '/mini/src/App.js#App';
const header = '/mini/src/components/Header.js#Header';

describe('GraphView selection and fading', () => {
    beforeEach(() => {
        vi.spyOn(console, 'error').mockImplementation(() => {});
        vi.spyOn(console, 'log').mockImplementation(() => {});
        vi.useFakeTimers({ toFake: ['requestAnimationFrame', 'cancelAnimationFrame'] });
    });
    afterEach(async () => {
        vi.useRealTimers();
        vi.restoreAllMocks();
        await new Promise(resolve => setTimeout(resolve, 0));
    });

    const nodes = (container: HTMLElement) =>
        Array.from(container.querySelectorAll<SVGGElement>('g.zoom-group g.node'));
    const node = (container: HTMLElement, label: string) => {
        const found = nodes(container).find(
            group => group.querySelector('.label-text')?.textContent === label
        );
        if (!found) {
            throw new Error(`no node ${label}`);
        }
        return found;
    };
    const overlay = (container: HTMLElement, label: string) => {
        const circle = node(container, label).querySelector('circle.circle-overlay');
        if (!circle) {
            throw new Error(`no overlay for ${label}`);
        }
        return circle;
    };
    /** Opacity per label; '' means not faded (1). */
    const nodeOpacities = (container: HTMLElement) =>
        Object.fromEntries(
            nodes(container).map(group => [
                group.querySelector('.label-text')?.textContent,
                group.style.opacity,
            ])
        );
    const linkOpacities = (container: HTMLElement) =>
        Array.from(
            container.querySelectorAll<SVGLineElement>('g.links line'),
            line => line.style.opacity
        );
    const nothingFaded = (container: HTMLElement) =>
        Object.values(nodeOpacities(container)).every(opacity => opacity === '') &&
        linkOpacities(container).every(opacity => opacity === '');

    it('selects a node on click and fades what is not connected to it (G1, §14)', () => {
        const { createLayout } = createFakeLayout();
        const { container, store } = drawView(createLayout);

        fireEvent.click(overlay(container, 'Header'));

        expect(store.get(selectionAtom)?.map(selected => selected.id)).toEqual([header]);
        expect(console.log).toHaveBeenCalledWith(
            'Select node: ',
            expect.objectContaining({ id: header, label: 'Header', type: 'component' })
        );
        expect(node(container, 'Header').querySelector('.circle-node')?.getAttribute('class')).toBe(
            'circle-node component selected'
        );
        expect(overlay(container, 'Header').getAttribute('stroke-width')).toBe('2');
        expect(overlay(container, 'App').getAttribute('stroke-width')).toBe('1');
        // Header has the links from App and (inherited) from BaseWidget.
        expect(nodeOpacities(container)).toEqual({
            App: '1',
            BaseWidget: '1',
            Counter: '0.1',
            Footer: '0.1',
            Header: '1',
            TodoItem: '0.1',
            TodoList: '0.1',
            ConnectedTodoList: '0.1',
        });
        // Links in graph order: App → Header, Counter, ConnectedTodoList, Footer; BaseWidget →
        // Header; TodoList → TodoItem; ConnectedTodoList → TodoList.
        expect(linkOpacities(container)).toEqual(['1', '0.1', '0.1', '0.1', '1', '0.1', '0.1']);
    });

    it('opens the component view on a double click on a component with inner functions (G3)', () => {
        const { createLayout } = createFakeLayout();
        const { container, store } = drawView(createLayout);

        // Footer has no inner function, ConnectedTodoList no graph (K5).
        fireEvent.doubleClick(node(container, 'Footer'));
        fireEvent.doubleClick(node(container, 'ConnectedTodoList'));
        expect(store.get(componentIdAtom)).toBeUndefined();

        fireEvent.doubleClick(node(container, 'App'));
        expect(store.get(componentIdAtom)).toBe(app);
        expect(container.querySelector('svg.qv-legend')?.getAttribute('height')).toBe('270');
    });

    it('keeps the nodes reached from the clicked one and fills them lightly', () => {
        const { createLayout } = createFakeLayout();
        const { container } = drawView(createLayout);

        fireEvent.click(overlay(container, 'App'));

        // From App over ConnectedTodoList to TodoList and TodoItem; only BaseWidget fades.
        expect(nodeOpacities(container)).toEqual({
            App: '1',
            BaseWidget: '0.1',
            Counter: '1',
            Footer: '1',
            Header: '1',
            TodoItem: '1',
            TodoList: '1',
            ConnectedTodoList: '1',
        });
        expect(linkOpacities(container)).toEqual(['1', '1', '1', '1', '0.1', '1', '1']);
        const fill = (label: string) =>
            node(container, label).querySelector<SVGElement>('.circle-node')?.style.fill;
        expect(fill('TodoList')).toBe('var(--qv-graph-indirect-fill)');
        expect(fill('TodoItem')).toBe('var(--qv-graph-indirect-fill)');
        expect(fill('ConnectedTodoList')).toBe('');
    });

    it('shows everything and clears the selection on a click on the background (G7)', () => {
        const { createLayout } = createFakeLayout();
        const { container, store, getByRole } = drawView(createLayout);
        fireEvent.click(overlay(container, 'Header'));

        // A click on a link is no click on the background.
        const link = container.querySelector('g.links line');
        if (!link) {
            throw new Error('no link');
        }
        fireEvent.click(link);
        expect(store.get(selectionAtom)).toHaveLength(1);

        fireEvent.click(getByRole('img', { name: 'Component graph' }));

        expect(store.get(selectionAtom)).toBeNull();
        expect(nothingFaded(container)).toBe(true);
        expect(node(container, 'Header').querySelector('.circle-node')?.getAttribute('class')).toBe(
            'circle-node component'
        );
    });

    it('fades while the pointer is over a node with Ctrl held (G6)', () => {
        const { createLayout } = createFakeLayout();
        const { container, store } = drawView(createLayout);

        fireEvent.pointerEnter(node(container, 'Header'));
        expect(nodeOpacities(container).Counter).toBe('');

        fireEvent.pointerEnter(node(container, 'Header'), { ctrlKey: true });
        expect(nodeOpacities(container).Counter).toBe('0.1');
        expect(store.get(selectionAtom)).toBeNull();

        fireEvent.pointerLeave(node(container, 'Header'), { ctrlKey: true });
        expect(nothingFaded(container)).toBe(true);
    });

    it('does not fade while a node is dragged', () => {
        const { createLayout } = createFakeLayout();
        const { container } = drawView(createLayout, { ...defaultSettings, autoZoom: false });

        fireEvent.pointerDown(node(container, 'Counter'), {
            pointerId: 1,
            clientX: 200,
            clientY: 0,
        });
        fireEvent.pointerMove(window, { pointerId: 1, clientX: 220, clientY: 10 });
        fireEvent.pointerEnter(node(container, 'Header'), { ctrlKey: true });
        expect(nothingFaded(container)).toBe(true);

        fireEvent.pointerUp(window, { pointerId: 1, clientX: 220, clientY: 10 });
        fireEvent.pointerEnter(node(container, 'Header'), { ctrlKey: true });
        expect(nodeOpacities(container).Footer).toBe('0.1');
    });

    it('selects without fading when "fade" is off', () => {
        const { createLayout } = createFakeLayout();
        const { container, store } = drawView(createLayout, { ...defaultSettings, fade: false });

        fireEvent.click(overlay(container, 'Header'));
        fireEvent.pointerEnter(node(container, 'App'), { ctrlKey: true });

        expect(store.get(selectionAtom)?.map(selected => selected.id)).toEqual([header]);
        expect(nothingFaded(container)).toBe(true);
    });

    it('removes a node and its links with Ctrl+click and lays out the rest from there (G5)', () => {
        const { createLayout, engines } = createFakeLayout();
        const { container, store } = drawView(createLayout);

        fireEvent.click(overlay(container, 'App'), { ctrlKey: true });

        expect(nodes(container)).toHaveLength(7);
        expect(
            nodes(container).map(group => group.querySelector('.label-text')?.textContent)
        ).not.toContain('App');
        // Only the three links without App are left.
        expect(container.querySelectorAll('g.links line')).toHaveLength(3);
        expect(store.get(selectionAtom)).toBeNull();
        expect(nothingFaded(container)).toBe(true);
        // The new engine starts from the old positions: the fake laid the nodes out 100 apart.
        expect(engines).toHaveLength(2);
        expect(engines[0]?.stopped).toBe(true);
        expect(engines[1]?.positions.slice(0, 2)).toEqual([
            { id: '/mini/src/base/BaseWidget.js#BaseWidget', x: 100, y: 0 },
            { id: '/mini/src/components/Counter.tsx#Counter', x: 200, y: 0 },
        ]);
        // Only the view lost the node, not the analysis.
        expect(mini.appGraph.nodes.some(each => each.id === app)).toBe(true);
    });

    it('keeps removed nodes across a restart and shows them again for a new graph', () => {
        const { createLayout } = createFakeLayout();
        const { container, store, rerender } = drawView(createLayout);
        fireEvent.click(overlay(container, 'App'), { ctrlKey: true });

        rerender(
            <GraphView
                createLayout={createLayout}
                settings={{ ...defaultSettings, colaLayout: false }}
                measure={measure}
            />
        );
        expect(nodes(container)).toHaveLength(7);

        act(() => store.set(analysisAtom, { ...store.get(analysisAtom) }));
        expect(nodes(container)).toHaveLength(8);
    });

    it('shows everything again after a restart of the layout', () => {
        const { createLayout } = createFakeLayout();
        const { container, rerender } = drawView(createLayout);
        fireEvent.click(overlay(container, 'Header'));

        rerender(
            <GraphView
                createLayout={createLayout}
                settings={{ ...defaultSettings, colaLayout: false }}
                measure={measure}
            />
        );

        expect(nothingFaded(container)).toBe(true);
    });
});

describe('GraphView overlapping labels', () => {
    beforeEach(() => {
        vi.spyOn(console, 'error').mockImplementation(() => {});
        vi.spyOn(console, 'log').mockImplementation(() => {});
        vi.useFakeTimers({
            toFake: ['requestAnimationFrame', 'cancelAnimationFrame', 'setTimeout', 'clearTimeout'],
        });
    });
    afterEach(async () => {
        vi.useRealTimers();
        vi.restoreAllMocks();
        await new Promise(resolve => setTimeout(resolve, 0));
    });

    /**
     * jsdom has no layout: a label is 10 px per letter (× `scale`) and 14 px high, centred on its
     * node. The fake lays the nodes out 100 apart, so only TodoList (600) and ConnectedTodoList
     * (700, 170 px wide) overlap. `shown` records whether each label was shown when measured.
     */
    const createLabelMeasure = () => {
        const state = { scale: 1, shown: [] as boolean[] };
        const measureLabel: LabelMeasure = label => {
            state.shown.push(label.style.display === '');
            const [x = 0, y = 0] = (label.closest('g.node')?.getAttribute('transform') ?? '')
                .replace(/[^\d.,-]/g, '')
                .split(',')
                .map(Number);
            const width = (label.textContent?.length ?? 0) * 10 * state.scale;
            return { x: x - width / 2, y: y - 7, width, height: 14 };
        };
        return { state, measureLabel };
    };

    const drawLabels = (
        createLayout: LayoutFactory,
        measureLabel: LabelMeasure,
        settings: Settings = defaultSettings
    ) =>
        renderWithState(
            <GraphView
                createLayout={createLayout}
                settings={settings}
                measure={measure}
                measureLabel={measureLabel}
            />,
            { initialValues: [done] }
        );

    /** Labels that are hidden, and the tooltips of the nodes. */
    const hidden = (container: HTMLElement) => ({
        labels: Array.from(
            container.querySelectorAll<SVGTSpanElement>('tspan.label-text'),
            label => (label.style.display === 'none' ? label.textContent : undefined)
        ).filter(Boolean),
        titles: Array.from(
            container.querySelectorAll('g.node > title'),
            title => title.textContent
        ),
    });
    const nothingHidden = { labels: [], titles: [] };

    const wait = (ms: number) => {
        act(() => {
            vi.advanceTimersByTime(ms);
        });
    };

    it('hides the earlier of two overlapping labels 250 ms after the layout end, with a tooltip', () => {
        const { createLayout } = createFakeLayout();
        const { measureLabel } = createLabelMeasure();
        const { container } = drawLabels(createLayout, measureLabel);

        // Zoom to fit after the end zooms too; the measuring waits for its last frame.
        wait(400);
        expect(hidden(container)).toEqual(nothingHidden);

        wait(250);
        expect(hidden(container)).toEqual({ labels: ['TodoList'], titles: ['TodoList'] });
        // The tooltip comes after the label, as the legacy app appended it to the node.
        const todoList = container.querySelector('g.node > title')?.parentElement;
        expect(todoList?.lastElementChild?.tagName).toBe('title');
    });

    it('measures again after a zoom change and at a later layout end, with all labels shown', () => {
        const { createLayout, engines } = createFakeLayout();
        const { state, measureLabel } = createLabelMeasure();
        const { container, getByRole } = drawLabels(createLayout, measureLabel);
        wait(650);
        expect(hidden(container).labels).toEqual(['TodoList']);

        state.scale = 0.5;
        state.shown = [];
        fireEvent.click(getByRole('button', { name: 'Zoom to 100%' }));
        wait(300);
        expect(hidden(container).labels).toEqual(['TodoList']);
        wait(250);
        expect(hidden(container)).toEqual(nothingHidden);
        expect(state.shown).toEqual(Array(8).fill(true));

        state.scale = 1;
        act(() => engines[0]?.end());
        wait(250);
        expect(hidden(container).labels).toEqual(['TodoList']);
    });

    it('hides no label with the setting off', () => {
        const { createLayout } = createFakeLayout();
        const { state, measureLabel } = createLabelMeasure();
        const { container } = drawLabels(createLayout, measureLabel, {
            ...defaultSettings,
            hideOverlappingLabels: false,
        });

        wait(1000);

        expect(hidden(container)).toEqual(nothingHidden);
        expect(state.shown).toEqual([]);
    });

    it('shows all labels again on a restart until the new layout has ended', () => {
        const { createLayout } = createFakeLayout();
        const { measureLabel } = createLabelMeasure();
        const { container, rerender } = drawLabels(createLayout, measureLabel);
        wait(650);
        expect(hidden(container).labels).toEqual(['TodoList']);

        rerender(
            <GraphView
                createLayout={createLayout}
                settings={{ ...defaultSettings, colaLayout: false }}
                measure={measure}
                measureLabel={measureLabel}
            />
        );
        expect(hidden(container)).toEqual(nothingHidden);

        wait(650);
        expect(hidden(container).labels).toEqual(['TodoList']);
    });
});

describe('GraphView legend and actions', () => {
    beforeEach(() => {
        vi.spyOn(console, 'error').mockImplementation(() => {});
        vi.spyOn(console, 'log').mockImplementation(() => {});
        vi.useFakeTimers({ toFake: ['requestAnimationFrame', 'cancelAnimationFrame'] });
    });
    afterEach(() => {
        vi.useRealTimers();
        vi.restoreAllMocks();
    });

    it('draws the legend of the view with the hatch of the graph', () => {
        const { createLayout } = createFakeLayout();
        const { container } = drawView(createLayout);

        const hatch = container.querySelector('svg.qv-graph pattern')?.id;
        const legend = container.querySelector('svg.qv-legend');
        expect(hatch).toMatch(/^qv-hatch-/);
        expect(legend?.querySelector('.circle-overlay[fill]')?.getAttribute('fill')).toBe(
            `url(#${hatch})`
        );
        expect(legend?.getAttribute('height')).toBe('246');
    });

    it('restarts the layout from the node positions with another size metric', () => {
        const { createLayout, engines } = createFakeLayout();
        const { getByRole } = drawView(createLayout);
        const select = () => getByRole('combobox', { name: 'Node size metric' });

        fireEvent.click(select());
        fireEvent.click(getByRole('option', { name: 'Cyclomatic Complexity' }));

        expect(engines).toHaveLength(2);
        expect(engines[0]?.stopped).toBe(true);
        expect(engines[1]?.positions).toEqual(
            engines[0]?.options.nodes.map(({ id, x, y }) => ({ id, x, y }))
        );
        expect(select().textContent).toBe('Cyclomatic Complexity');
    });

    it('goes back to "Lines of Code" in the component view and back to the app graph (N11, N13)', () => {
        const { createLayout } = createFakeLayout();
        const { container, getByRole, queryByRole, store } = drawView(createLayout);
        const select = () => getByRole('combobox', { name: 'Node size metric' });
        expect(queryByRole('button', { name: 'Back to app graph' })).toBeNull();

        fireEvent.click(select());
        fireEvent.click(getByRole('option', { name: 'Lines of JSX Code' }));
        act(() => store.set(componentIdAtom, app));
        expect(select().textContent).toBe('Lines of Code');
        expect(container.querySelector('svg.qv-legend')?.getAttribute('height')).toBe('270');

        fireEvent.click(getByRole('button', { name: 'Back to app graph' }));
        expect(store.get(componentIdAtom)).toBeUndefined();
        expect(select().textContent).toBe('Lines of Code');
    });

    it('toggles full screen and fits the graph in, also without "Auto zoom"', () => {
        const { createLayout } = createFakeLayout();
        const { container, getByRole, store } = drawView(createLayout, {
            ...defaultSettings,
            autoZoom: false,
        });
        finishZoom();
        expect(zoomGroupTransform(container)).toBe('translate(0,0) scale(1)');

        fireEvent.click(getByRole('button', { name: 'Toggle fullscreen' }));
        finishZoom();
        expect(store.get(fullScreenAtom)).toBe(true);
        expect(zoomGroupTransform(container)).toBe('translate(25,150) scale(0.5)');
        expect(getByRole('button', { name: 'Toggle fullscreen' }).textContent).toBe(
            'fullscreen_exit'
        );
    });
});
