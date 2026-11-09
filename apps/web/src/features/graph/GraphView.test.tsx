import { analyzeProject, defaultSettings } from '@qualivis/core';
import { StrictMode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { analysisAtom, initialAnalysisState } from '../../state/analysisAtoms';
import { loadFixture } from '../../test/fixtures';
import { renderWithState } from '../../test/renderWithState';
import { initial } from '../../test/TestProvider';
import { GraphView } from './GraphView';
import type { LayoutFactory, LayoutOptions } from './layout/createLayout';
import type { LayoutEngine } from './layout/types';

const mini = analyzeProject(loadFixture('mini'));
const done = initial(analysisAtom, { ...initialAnalysisState, status: 'done', result: mini });

type FakeEngine = { colaLayout: boolean; options: LayoutOptions; stopped: boolean };

/** Fake engine: puts the nodes in a row at once and reports the end, without animation. */
const createFakeLayout = () => {
    const engines: FakeEngine[] = [];
    const createLayout: LayoutFactory = (colaLayout, options) => {
        const { nodes } = options;
        const record = { colaLayout, options, stopped: false };
        engines.push(record);
        const endListeners = new Set<() => void>();
        const engine: LayoutEngine = {
            start: () => {
                nodes.forEach((node, index) => {
                    node.x = index * 100;
                    node.y = 0;
                });
                for (const listener of endListeners) {
                    listener();
                }
            },
            stop: () => {
                record.stopped = true;
            },
            onTick: () => () => undefined,
            onEnd: listener => {
                endListeners.add(listener);
                return () => endListeners.delete(listener);
            },
            dragStart: () => undefined,
            drag: () => undefined,
            dragEnd: () => undefined,
        };
        return engine;
    };
    return { engines, createLayout };
};

describe('GraphView', () => {
    // The view model logs nodes without a report (K5: ConnectedTodoList); keep the output clean.
    beforeEach(() => {
        vi.spyOn(console, 'error').mockImplementation(() => {});
    });
    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('draws the 8 nodes and 7 links of the mini app graph, fitted into the view', () => {
        const { createLayout } = createFakeLayout();
        const { container, getByRole } = renderWithState(
            <GraphView createLayout={createLayout} />,
            {
                initialValues: [done],
            }
        );

        expect(container.querySelectorAll('g.node')).toHaveLength(8);
        expect(container.querySelectorAll('g.links line')).toHaveLength(7);
        // Nodes at x = 0 … 700, y = 0, plus 48 px on every side.
        expect(getByRole('img', { name: 'Component graph' }).getAttribute('viewBox')).toBe(
            '-48 -48 796 96'
        );
    });

    it('sizes the nodes by their lines of code', () => {
        const { createLayout } = createFakeLayout();
        const { container } = renderWithState(<GraphView createLayout={createLayout} />, {
            initialValues: [done],
        });

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
        renderWithState(<GraphView createLayout={createLayout} />, { initialValues: [done] });

        expect(mini.appGraph.nodes.every(node => node.x === undefined)).toBe(true);
        expect(mini.appGraph.nodes.every(node => node.width === undefined)).toBe(true);
    });

    it('draws nothing before an analysis result exists', () => {
        const { createLayout, engines } = createFakeLayout();
        const { container } = renderWithState(<GraphView createLayout={createLayout} />);

        expect(container.querySelector('svg')).toBeNull();
        expect(engines).toHaveLength(0);
    });

    it('leaves no engine running in StrictMode and after unmount', () => {
        const { createLayout, engines } = createFakeLayout();
        const { unmount } = renderWithState(
            <StrictMode>
                <GraphView createLayout={createLayout} />
            </StrictMode>,
            { initialValues: [done] }
        );

        expect(engines.filter(engine => !engine.stopped)).toHaveLength(1);
        unmount();
        expect(engines.every(engine => engine.stopped)).toBe(true);
    });

    it('lays out with WebCola by default, without constraints in the app view', () => {
        const { createLayout, engines } = createFakeLayout();
        renderWithState(<GraphView createLayout={createLayout} />, { initialValues: [done] });

        expect(engines).toHaveLength(1);
        expect(engines[0]?.colaLayout).toBe(true);
        expect(engines[0]?.options.constraints).toEqual([]);
        expect(engines[0]?.options.nodes).toHaveLength(8);
        expect(engines[0]?.options.links).toHaveLength(7);
    });

    it('switches the engine without a reload and stops the old one', () => {
        const { createLayout, engines } = createFakeLayout();
        const { container, rerender } = renderWithState(<GraphView createLayout={createLayout} />, {
            initialValues: [done],
        });

        rerender(
            <GraphView
                createLayout={createLayout}
                settings={{ ...defaultSettings, colaLayout: false }}
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
        const { rerender } = renderWithState(<GraphView createLayout={createLayout} />, {
            initialValues: [done],
        });

        rerender(
            <GraphView
                createLayout={createLayout}
                settings={{ ...defaultSettings, nodeSizesBasedOnMetrics: false }}
            />
        );

        expect(engines).toHaveLength(2);
        expect(engines[0]?.stopped).toBe(true);
        expect(engines[1]?.options.nodes).not.toBe(engines[0]?.options.nodes);
        // Without sizes by metric every node is 48 wide (2 × circleRadius), as in the legacy app.
        expect(engines[1]?.options.nodes.every(node => node.width === 48)).toBe(true);
    });
});
