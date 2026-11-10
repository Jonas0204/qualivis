import { type ReactConstraint, reactConstraints } from '@qualivis/core';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createColaLayout } from './colaLayout';
import type { LayoutEngine, LayoutLink, LayoutNode } from './types';

const node = (id: string): LayoutNode => ({ id, width: 30, height: 30 });

/** A → B → C */
const chain = () => {
    const nodes = ['A', 'B', 'C'].map(node);
    const [a, b, c] = nodes as [LayoutNode, LayoutNode, LayoutNode];
    const links: LayoutLink[] = [
        { source: a, target: b },
        { source: b, target: c },
    ];
    return { nodes, links, a, b, c };
};

/** A class component with its lifecycle methods, in the order of the analysis. */
const component = () => {
    const nodes = ['App', 'render', 'componentDidMount', 'constructor'].map(node);
    const [app, ...methods] = nodes as [LayoutNode, ...LayoutNode[]];
    const links: LayoutLink[] = methods.map(method => ({ source: app, target: method }));
    return { nodes, links };
};

const area = { width: 800, height: 600 };

type Run = { engine: LayoutEngine; ticks: () => number; ends: () => number };

/** Starts a WebCola engine and counts its ticks and ends. */
const startLayout = (
    nodes: LayoutNode[],
    links: LayoutLink[],
    constraints: readonly ReactConstraint[] = []
): Run => {
    const engine = createColaLayout({ nodes, links, constraints, ...area });
    let ticks = 0;
    let ends = 0;
    engine.onTick(() => {
        ticks++;
    });
    engine.onEnd(() => {
        ends++;
    });
    engine.start();
    return { engine, ticks: () => ticks, ends: () => ends };
};

const positions = (nodes: LayoutNode[]) => nodes.map(({ x, y }) => [x, y]);

const byId = (nodes: LayoutNode[], id: string): LayoutNode => {
    const found = nodes.find(n => n.id === id);
    if (!found) {
        throw new Error(`No node ${id}`);
    }
    return found;
};

describe('createColaLayout', () => {
    beforeEach(() => {
        vi.useFakeTimers({ toFake: ['requestAnimationFrame', 'cancelAnimationFrame'] });
    });
    afterEach(() => {
        vi.useRealTimers();
    });

    it('lays out the nodes frame by frame and reports the end', () => {
        const { nodes, links } = chain();
        const run = startLayout(nodes, links);

        // The first layout waits for the next frame.
        expect(nodes.every(n => n.x === undefined)).toBe(true);
        vi.advanceTimersToNextFrame();
        expect(nodes.every(n => Number.isFinite(n.x) && Number.isFinite(n.y))).toBe(true);

        vi.runAllTimers();

        expect(run.ticks()).toBeGreaterThan(0);
        expect(run.ends()).toBe(1);
        expect(vi.getTimerCount()).toBe(0);
        expect(nodes.every(n => Number.isFinite(n.x) && Number.isFinite(n.y))).toBe(true);
    });

    it('lets the links flow from top to bottom', () => {
        const { nodes, links, a, b, c } = chain();
        startLayout(nodes, links);
        vi.runAllTimers();

        // flowLayout('y', 100): every target at least 100 below its source.
        expect((a.y ?? 0) + 100).toBeLessThanOrEqual((b.y ?? 0) + 1);
        expect((b.y ?? 0) + 100).toBeLessThanOrEqual((c.y ?? 0) + 1);
    });

    it('gives the same positions for the same input', () => {
        const first = chain();
        startLayout(first.nodes, first.links);
        vi.runAllTimers();
        const second = chain();
        startLayout(second.nodes, second.links);
        vi.runAllTimers();

        expect(positions(second.nodes)).toEqual(positions(first.nodes));
    });

    it('puts the React methods from left to right in lifecycle order', () => {
        const { nodes, links } = component();
        const constraints = reactConstraints(nodes, 100);
        startLayout(nodes, links, constraints);
        vi.runAllTimers();

        const x = (id: string) => byId(nodes, id).x ?? Number.NaN;
        expect(constraints).toHaveLength(2);
        expect(x('constructor') + 100).toBeLessThanOrEqual(x('componentDidMount') + 1);
        expect(x('componentDidMount') + 100).toBeLessThanOrEqual(x('render') + 1);
    });

    it('lays out a graph without nodes', () => {
        const run = startLayout([], []);
        vi.runAllTimers();

        expect(run.ends()).toBe(1);
    });

    it('leaves the nodes untouched when it stops before the first frame', () => {
        const { nodes, links } = chain();
        const run = startLayout(nodes, links);

        run.engine.stop();
        vi.runAllTimers();

        expect(nodes.every(n => n.x === undefined)).toBe(true);
        expect(run.ticks()).toBe(0);
        expect(vi.getTimerCount()).toBe(0);
    });

    it('stops the animation for good', () => {
        const { nodes, links, b } = chain();
        const run = startLayout(nodes, links);
        vi.advanceTimersToNextFrame();
        vi.advanceTimersToNextFrame();
        const ticks = run.ticks();

        run.engine.stop();
        run.engine.dragStart(b);
        run.engine.drag(b, { x: 0, y: 0 });
        vi.runAllTimers();

        expect(run.ticks()).toBe(ticks);
        expect(run.ends()).toBe(0);
        expect(vi.getTimerCount()).toBe(0);
    });

    it('moves a dragged node and runs the layout again', () => {
        const { nodes, links, b } = chain();
        const run = startLayout(nodes, links);
        vi.runAllTimers();
        const ticks = run.ticks();

        run.engine.dragStart(b);
        run.engine.drag(b, { x: 500, y: 450 });
        vi.runAllTimers();

        expect(run.ticks()).toBeGreaterThan(ticks);
        expect(run.ends()).toBe(2);
        expect(b.x).toBeCloseTo(500, 6);
        expect(b.y).toBeCloseTo(450, 6);
    });

    it('releases a dragged node even with Shift, like the legacy app', () => {
        const { nodes, links, b } = chain();
        const run = startLayout(nodes, links);
        vi.runAllTimers();

        run.engine.dragStart(b);
        run.engine.drag(b, { x: 500, y: 450 });
        run.engine.dragEnd(b, { pin: true });

        // WebCola keeps a node in place while bit 2 (dragged) or 4 (mouse over) of `fixed` is set.
        expect((b as LayoutNode & { fixed?: number }).fixed).toBe(0);
    });
});
