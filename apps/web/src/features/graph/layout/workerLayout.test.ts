import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { perfSnapshot, resetPerfStats } from '../../../lib/perfStats';
import type { ForceLayoutOptions } from './forceLayout';
import type { LayoutReply, LayoutRequest } from './layoutHost';
import type { LayoutNode } from './types';
import { createWorkerLayout, type LayoutWorker } from './workerLayout';

const graph = (overrides: Partial<ForceLayoutOptions> = {}): ForceLayoutOptions => {
    const nodes: LayoutNode[] = ['a', 'b', 'c'].map(id => ({ id, width: 48, height: 48 }));
    const [a, b, c] = nodes as [LayoutNode, LayoutNode, LayoutNode];
    return {
        nodes,
        links: [
            { source: a, target: b },
            { source: a, target: c },
        ],
        width: 800,
        height: 600,
        ...overrides,
    };
};

/** A worker that records the requests and answers when the test says so. */
const startLayout = (options: ForceLayoutOptions) => {
    const requests: LayoutRequest[] = [];
    let terminated = false;
    const worker: LayoutWorker = {
        postMessage: request => requests.push(request),
        terminate: () => {
            terminated = true;
        },
        onmessage: null,
    };
    const engine = createWorkerLayout(options, () => worker);
    let ticks = 0;
    let ends = 0;
    engine.onTick(() => {
        ticks++;
    });
    engine.onEnd(() => {
        ends++;
    });
    const reply = (type: LayoutReply['type'], positions: number[], tickMs: number[] = []) =>
        worker.onmessage?.({ data: { type, positions: Float64Array.from(positions), tickMs } });
    return {
        engine,
        requests,
        reply,
        ticks: () => ticks,
        ends: () => ends,
        terminated: () => terminated,
        types: () => requests.map(request => request.type),
    };
};

const positions = (nodes: LayoutNode[]) => nodes.flatMap(({ x, y }) => [x, y]);

describe('createWorkerLayout', () => {
    beforeEach(() => {
        vi.useFakeTimers({ toFake: ['requestAnimationFrame', 'cancelAnimationFrame'] });
        resetPerfStats();
    });
    afterEach(() => {
        vi.useRealTimers();
    });

    it('gives the nodes their start positions at once, before the worker answers', () => {
        const options = graph();

        startLayout(options);

        expect(positions(options.nodes).every(Number.isFinite)).toBe(true);
    });

    it('starts the worker with the nodes and the links by index', () => {
        const options = graph({ flow: { constraints: [] } });
        const { engine, requests } = startLayout(options);

        engine.start();

        expect(requests).toEqual([
            {
                type: 'start',
                nodes: options.nodes.map(({ x, y }) => ({
                    width: 48,
                    height: 48,
                    x,
                    y,
                    fx: undefined,
                    fy: undefined,
                })),
                links: [
                    [0, 1],
                    [0, 2],
                ],
                width: 800,
                height: 600,
                flow: { constraints: [] },
                atRest: false,
            },
        ]);
    });

    it('takes the positions of the worker, tells the listeners and asks for more in the next frame', () => {
        const options = graph();
        const { engine, requests, reply, ticks, ends, types } = startLayout(options);
        engine.start();

        reply('tick', [1, 2, 3, 4, 5, 6], [0.5, 1.5]);

        expect(positions(options.nodes)).toEqual([1, 2, 3, 4, 5, 6]);
        expect(ticks()).toBe(1);
        expect(ends()).toBe(0);
        expect(perfSnapshot().durations['layout.tick']).toMatchObject({ count: 2, totalMs: 2 });
        expect(requests).toHaveLength(1);

        vi.advanceTimersByTime(20);
        expect(types()).toEqual(['start', 'ack']);
    });

    it('reports the end with the final positions', () => {
        const options = graph();
        const { engine, reply, ticks, ends, types } = startLayout(options);
        engine.start();

        reply('end', [7, 8, 9, 10, 11, 12]);

        expect(positions(options.nodes)).toEqual([7, 8, 9, 10, 11, 12]);
        expect(ticks()).toBe(1);
        expect(ends()).toBe(1);
        vi.advanceTimersByTime(20);
        expect(types()).toEqual(['start']);
    });

    it('halts through the worker, and not at rest', () => {
        const { engine, reply, types } = startLayout(graph());
        engine.start();

        engine.halt();
        expect(types()).toEqual(['start', 'halt']);

        reply('end', [0, 0, 0, 0, 0, 0]);
        engine.halt();
        expect(types()).toEqual(['start', 'halt']);
    });

    it('keeps restored positions at rest and reports the end at once (ADR-011 A22)', () => {
        const options = graph({ restore: { running: false } });
        const { engine, requests, ends, types } = startLayout(options);

        engine.start();

        expect(ends()).toBe(1);
        expect(requests[0]).toMatchObject({ type: 'start', atRest: true });
        engine.halt();
        expect(types()).toEqual(['start']);
    });

    it('goes on animating from restored positions', () => {
        const options = graph({ restore: { running: true } });
        const [first] = options.nodes;
        Object.assign(first ?? {}, { x: 40, y: 50 });
        const { engine, requests, ends } = startLayout(options);

        engine.start();

        expect(ends()).toBe(0);
        expect(requests[0]).toMatchObject({ atRest: false, nodes: [{ x: 40, y: 50 }, {}, {}] });
    });

    it('pins the dragged node to the pointer and releases it unless pinned', () => {
        const options = graph();
        const [, second] = options.nodes as [LayoutNode, LayoutNode];
        const { engine, requests, reply } = startLayout(options);
        engine.start();
        reply('end', [0, 0, 0, 0, 0, 0]);

        engine.drag(second, { x: 30, y: 40 });
        expect(second).toMatchObject({ fx: 30, fy: 40 });
        expect(requests.at(-1)).toEqual({ type: 'drag', node: 1, x: 30, y: 40 });
        // Dragging runs the layout again, so it can be halted again.
        engine.halt();
        expect(requests.at(-1)).toEqual({ type: 'halt' });

        engine.dragEnd(second, { pin: true });
        expect(second).toMatchObject({ fx: 30, fy: 40 });
        expect(requests.at(-1)).toEqual({ type: 'dragEnd', node: 1, release: false });

        engine.dragEnd(second, { pin: false });
        expect(second).toMatchObject({ fx: null, fy: null });
        expect(requests.at(-1)).toEqual({ type: 'dragEnd', node: 1, release: true });
    });

    it('releases a dragged node even with Shift in the flow layout, like the legacy app', () => {
        const options = graph({ flow: { constraints: [] } });
        const [first] = options.nodes as [LayoutNode];
        const { engine, requests } = startLayout(options);
        engine.start();

        engine.drag(first, { x: 1, y: 2 });
        engine.dragEnd(first, { pin: true });

        expect(first).toMatchObject({ fx: null, fy: null });
        expect(requests.at(-1)).toEqual({ type: 'dragEnd', node: 0, release: true });
    });

    it('stops for good: ends the worker and takes nothing from it any more', () => {
        const options = graph();
        const { engine, requests, reply, ticks, terminated } = startLayout(options);
        engine.start();
        reply('tick', [1, 2, 3, 4, 5, 6]);
        const [first] = options.nodes as [LayoutNode];

        engine.stop();
        reply('tick', [9, 9, 9, 9, 9, 9]);
        vi.advanceTimersByTime(20);
        engine.drag(first, { x: 0, y: 0 });

        expect(terminated()).toBe(true);
        expect(positions(options.nodes)).toEqual([1, 2, 3, 4, 5, 6]);
        expect(ticks()).toBe(1);
        expect(requests).toHaveLength(1);
    });
});
