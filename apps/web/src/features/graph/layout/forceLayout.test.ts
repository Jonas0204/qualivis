import { type ReactConstraint, reactConstraints } from '@qualivis/core';
import type { ForceCenter, ForceCollide, ForceLink, ForceManyBody } from 'd3-force';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { perfSnapshot, resetPerfStats } from '../../../lib/perfStats';
import { createForceLayout, createForceSimulation, type ForceLayoutOptions } from './forceLayout';
import type { LayoutEngine, LayoutLink, LayoutNode } from './types';

const node = (id: string): LayoutNode => ({ id, width: 48, height: 48 });

const chain = (count: number): ForceLayoutOptions => {
    const nodes = Array.from({ length: count }, (_, index) => node(`n${index}`));
    const links: LayoutLink[] = nodes.slice(1).flatMap((target, index) => {
        const source = nodes[index];
        return source ? [{ source, target }] : [];
    });
    return { nodes, links, width: 800, height: 600 };
};

const flow = (constraints: readonly ReactConstraint[] = []) => ({ constraints });

const chargeOf = (options: ForceLayoutOptions) => {
    const simulation = createForceSimulation(options).stop();
    const strength = simulation.force<ForceManyBody<LayoutNode>>('charge')?.strength();
    return strength?.(node('any'), 0, options.nodes);
};

const positions = (nodes: LayoutNode[]) => nodes.map(({ x, y }) => [x, y]);

/** Ticks of the simulation since the last reset of the timings. */
const tickCount = () => perfSnapshot().durations['layout.tick']?.count ?? 0;

type Run = { engine: LayoutEngine; ticks: () => number; ends: () => number };

/** Starts an engine and counts its ticks and ends. */
const startLayout = (options: ForceLayoutOptions): Run => {
    const engine = createForceLayout(options);
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

describe('createForceSimulation', () => {
    it('uses the legacy forces', () => {
        const options = chain(8);
        const [first, second] = options.nodes;
        const [firstLink] = options.links;
        if (!first || !second || !firstLink) {
            throw new Error('chain too short');
        }

        const simulation = createForceSimulation(options).stop();
        const link = simulation.force<ForceLink<LayoutNode, LayoutLink>>('link');
        const center = simulation.force<ForceCenter<LayoutNode>>('center');
        const collide = simulation.force<ForceCollide<LayoutNode>>('collide');

        expect(chargeOf(options)).toBe(-4000 + 8 * 200);
        expect(link?.distance()(firstLink, 0, options.links)).toBe(100);
        expect([center?.x(), center?.y()]).toEqual([400, 300]);
        expect(collide?.radius()(first, 0, options.nodes)).toBeCloseTo(28.8);
        // Links keep their node objects (no id lookup).
        expect([firstLink.source, firstLink.target]).toEqual([first, second]);
    });

    it('limits the charge to -400 for large graphs', () => {
        expect(chargeOf(chain(25))).toBe(-400);
    });

    it('takes half the legacy minimum charge in the flow layout', () => {
        expect(chargeOf({ ...chain(8), flow: flow() })).toBe(-200);
    });
});

describe.each([
    ['force layout', undefined],
    ['flow layout', flow()],
])('createForceLayout, %s', (_name, flowOption) => {
    beforeEach(() => {
        vi.useFakeTimers({ toFake: ['requestAnimationFrame', 'cancelAnimationFrame'] });
        resetPerfStats();
    });
    afterEach(() => {
        vi.useRealTimers();
        vi.restoreAllMocks();
    });

    const layoutOptions = (count: number) => ({ ...chain(count), flow: flowOption });

    it('ticks once in the first frame, 300 times in all, and reports the end once', () => {
        const run = startLayout(layoutOptions(3));

        expect(run.ticks()).toBe(0);
        vi.advanceTimersToNextFrame();
        expect(run.ticks()).toBe(1);
        expect(tickCount()).toBe(1);
        vi.runAllTimers();

        expect(tickCount()).toBe(300);
        expect(run.ends()).toBe(1);
        expect(vi.getTimerCount()).toBe(0);
    });

    it('ticks 240 times per second, several times in a frame and once per frame to listeners', () => {
        const run = startLayout(layoutOptions(3));

        // The fake animation frames come every 16 ms, as on a 60 Hz display.
        vi.advanceTimersByTime(1000);

        expect(tickCount()).toBeGreaterThanOrEqual(230);
        expect(tickCount()).toBeLessThanOrEqual(240);
        expect(run.ticks()).toBeLessThan(65);
        run.engine.stop();
    });

    it('stops the ticks of a frame when they take longer than the budget', () => {
        let clock = 0;
        vi.spyOn(performance, 'now').mockImplementation(() => {
            clock += 10;
            return clock;
        });
        const run = startLayout(layoutOptions(3));

        for (let frame = 0; frame < 10; frame++) {
            vi.advanceTimersToNextFrame();
        }

        expect(tickCount()).toBe(10);
        run.engine.stop();
    });

    it('gives the same positions for the same input', () => {
        const first = layoutOptions(5);
        startLayout(first);
        vi.runAllTimers();
        const second = layoutOptions(5);
        startLayout(second);
        vi.runAllTimers();

        expect(positions(second.nodes)).toEqual(positions(first.nodes));
    });

    it('lays out a graph without nodes', () => {
        const run = startLayout(layoutOptions(0));
        vi.runAllTimers();

        expect(run.ends()).toBe(1);
    });

    it('stops for good, also for dragging', () => {
        const options = layoutOptions(3);
        const run = startLayout(options);
        vi.advanceTimersToNextFrame();
        const [first] = options.nodes;
        if (!first) {
            throw new Error('chain too short');
        }

        run.engine.stop();
        run.engine.drag(first, { x: 0, y: 0 });
        vi.runAllTimers();

        expect(run.ticks()).toBe(1);
        expect(run.ends()).toBe(0);
        expect(vi.getTimerCount()).toBe(0);
    });

    it('halts without a further tick and runs again when a node is dragged', () => {
        const options = layoutOptions(3);
        const run = startLayout(options);
        vi.advanceTimersToNextFrame();
        const halted = positions(options.nodes);
        const [first] = options.nodes;
        if (!first) {
            throw new Error('chain too short');
        }

        run.engine.halt();
        run.engine.halt();
        vi.runAllTimers();

        expect(run.ticks()).toBe(1);
        expect(run.ends()).toBe(1);
        expect(positions(options.nodes)).toEqual(halted);

        run.engine.drag(first, { x: 500, y: 450 });
        vi.advanceTimersToNextFrame();
        expect(run.ticks()).toBe(2);
        expect([first.x, first.y]).toEqual([500, 450]);
        run.engine.stop();
    });

    it('keeps restored positions at rest and reports the end without a tick (ADR-011 A22)', () => {
        const options = layoutOptions(3);
        for (const [index, each] of options.nodes.entries()) {
            Object.assign(each, { x: index * 100, y: index * 150 });
        }
        const run = startLayout({ ...options, restore: { running: false } });
        vi.runAllTimers();

        expect(run.ticks()).toBe(0);
        expect(run.ends()).toBe(1);
        expect(positions(options.nodes)).toEqual([
            [0, 0],
            [100, 150],
            [200, 300],
        ]);
    });

    it('goes on animating from restored positions', () => {
        const options = layoutOptions(3);
        for (const [index, each] of options.nodes.entries()) {
            Object.assign(each, { x: index * 200, y: index * 150 });
        }
        const run = startLayout({ ...options, restore: { running: true } });
        expect(positions(options.nodes)[2]).toEqual([400, 300]);

        vi.advanceTimersToNextFrame();
        expect(run.ticks()).toBe(1);
        run.engine.stop();
    });

    it('reports ticks only to the listeners that are still there', () => {
        const engine = createForceLayout(layoutOptions(3));
        const removed = vi.fn();
        const kept = vi.fn();
        engine.onTick(removed)();
        engine.onTick(kept);

        engine.start();
        vi.advanceTimersToNextFrame();
        engine.stop();

        expect(removed).not.toHaveBeenCalled();
        expect(kept).toHaveBeenCalledTimes(1);
    });
});

describe('createForceLayout on a fast display', () => {
    afterEach(() => {
        vi.unstubAllGlobals();
        resetPerfStats();
    });

    it('moves the nodes in at most 120 frames per second, with 240 ticks per second', () => {
        const frames: FrameRequestCallback[] = [];
        vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) =>
            frames.push(callback)
        );
        vi.stubGlobal('cancelAnimationFrame', () => undefined);
        resetPerfStats();
        const run = startLayout(chain(3));

        // A 240 Hz display: 240 frames in one second.
        for (let index = 0; index < 240; index++) {
            frames.shift()?.(index * (1000 / 240));
        }

        expect(run.ticks()).toBeGreaterThanOrEqual(115);
        expect(run.ticks()).toBeLessThanOrEqual(121);
        expect(tickCount()).toBeGreaterThanOrEqual(230);
        expect(tickCount()).toBeLessThanOrEqual(240);
        run.engine.stop();
    });
});

describe('createForceLayout dragging', () => {
    it('pins the dragged node to the pointer and releases it unless pinned', () => {
        const options = chain(3);
        const [first, second] = options.nodes;
        if (!first || !second) {
            throw new Error('chain too short');
        }
        const layout = createForceLayout(options);

        layout.drag(first, { x: 10, y: 20 });
        expect([first.fx, first.fy]).toEqual([10, 20]);
        layout.dragEnd(first, { pin: false });
        expect([first.fx, first.fy]).toEqual([null, null]);

        layout.drag(second, { x: 30, y: 40 });
        layout.dragEnd(second, { pin: true });
        expect([second.fx, second.fy]).toEqual([30, 40]);

        layout.stop();
    });

    it('releases a dragged node even with Shift in the flow layout, like the legacy app', () => {
        const options = chain(3);
        const [first] = options.nodes;
        if (!first) {
            throw new Error('chain too short');
        }
        const layout = createForceLayout({ ...options, flow: flow() });

        layout.drag(first, { x: 10, y: 20 });
        layout.dragEnd(first, { pin: true });

        expect([first.fx, first.fy]).toEqual([null, null]);
        layout.stop();
    });
});

describe('createForceLayout, flow rules', () => {
    beforeEach(() => {
        vi.useFakeTimers({ toFake: ['requestAnimationFrame', 'cancelAnimationFrame'] });
    });
    afterEach(() => {
        vi.useRealTimers();
    });

    it('lets the links flow from top to bottom after every tick', () => {
        const options = { ...chain(4), flow: flow() };
        const run = startLayout(options);
        const check = () => {
            for (const { source, target } of options.links) {
                expect((target.y ?? 0) - (source.y ?? 0)).toBeGreaterThanOrEqual(100 - 1e-9);
            }
        };

        vi.advanceTimersToNextFrame();
        check();
        vi.runAllTimers();
        check();
        expect(run.ends()).toBe(1);
    });

    it('puts the React methods from left to right in lifecycle order', () => {
        const nodes = ['App', 'render', 'componentDidMount', 'constructor'].map(node);
        const [app, ...methods] = nodes as [LayoutNode, ...LayoutNode[]];
        const links = methods.map(method => ({ source: app, target: method }));
        const constraints = reactConstraints(nodes, 100);
        startLayout({ nodes, links, width: 800, height: 600, flow: flow(constraints) });
        vi.runAllTimers();

        const x = (id: string) => nodes.find(each => each.id === id)?.x ?? Number.NaN;
        expect(constraints).toHaveLength(2);
        expect(x('constructor') + 100).toBeLessThanOrEqual(x('componentDidMount') + 1e-9);
        expect(x('componentDidMount') + 100).toBeLessThanOrEqual(x('render') + 1e-9);
    });
});
