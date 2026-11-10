import type { ForceCenter, ForceCollide, ForceLink, ForceManyBody } from 'd3-force';
import { describe, expect, it, vi } from 'vitest';
import {
    createForceLayout,
    createForceSimulation,
    type ForceLayoutOptions,
    type ForceSimulation,
} from './forceLayout';
import type { LayoutLink, LayoutNode } from './types';

const node = (id: string): LayoutNode => ({ id, width: 48, height: 48 });

const chain = (count: number): ForceLayoutOptions => {
    const nodes = Array.from({ length: count }, (_, index) => node(`n${index}`));
    const links: LayoutLink[] = nodes.slice(1).flatMap((target, index) => {
        const source = nodes[index];
        return source ? [{ source, target }] : [];
    });
    return { nodes, links, width: 800, height: 600 };
};

/** Runs all ticks of a stopped simulation at once: alpha falls below alphaMin after 300 ticks. */
const runToEnd = (simulation: ForceSimulation) => simulation.tick(300);

const chargeOf = (options: ForceLayoutOptions) => {
    const simulation = createForceSimulation(options).stop();
    const strength = simulation.force<ForceManyBody<LayoutNode>>('charge')?.strength();
    return strength?.(node('any'), 0, options.nodes);
};

const distance = (a: LayoutNode, b: LayoutNode) =>
    Math.hypot((a.x ?? 0) - (b.x ?? 0), (a.y ?? 0) - (b.y ?? 0));

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

    it('limits the charge to -400 for large graphs and takes a given force', () => {
        expect(chargeOf(chain(25))).toBe(-400);
        expect(chargeOf({ ...chain(25), force: -1234 })).toBe(-1234);
    });

    it('settles every node near the centre without NaN', () => {
        const options = chain(12);
        runToEnd(createForceSimulation(options).stop());

        for (const { x, y } of options.nodes) {
            expect(Number.isFinite(x)).toBe(true);
            expect(Number.isFinite(y)).toBe(true);
            expect(Math.abs((x ?? 0) - 400)).toBeLessThan(2000);
            expect(Math.abs((y ?? 0) - 300)).toBeLessThan(2000);
        }
    });

    it('keeps linked nodes closer together than unlinked ones', () => {
        const [a, b, c, d] = ['a', 'b', 'c', 'd'].map(node);
        if (!a || !b || !c || !d) {
            throw new Error('missing node');
        }
        const links = [{ source: a, target: b }];

        runToEnd(
            createForceSimulation({ nodes: [a, b, c, d], links, width: 800, height: 600 }).stop()
        );

        expect(distance(a, b)).toBeLessThan(distance(c, d));
    });
});

describe('createForceLayout', () => {
    it('pins the dragged node to the pointer and releases it unless pinned', () => {
        const options = chain(3);
        const [first, second] = options.nodes;
        if (!first || !second) {
            throw new Error('chain too short');
        }
        const layout = createForceLayout(options);

        layout.dragStart(first);
        layout.drag(first, { x: 10, y: 20 });
        expect([first.fx, first.fy]).toEqual([10, 20]);
        layout.dragEnd(first, { pin: false });
        expect([first.fx, first.fy]).toEqual([null, null]);

        layout.dragStart(second);
        layout.drag(second, { x: 30, y: 40 });
        layout.dragEnd(second, { pin: true });
        expect([second.fx, second.fy]).toEqual([30, 40]);

        layout.stop();
    });

    it('halts without a further tick and reports the end once', async () => {
        const options = chain(3);
        const layout = createForceLayout(options);
        const ended = vi.fn();
        layout.onEnd(ended);
        const ticked = new Promise<void>(resolve => layout.onTick(resolve));
        layout.start();
        await ticked;
        const ticks = vi.fn();
        layout.onTick(ticks);
        const halted = options.nodes.map(({ x, y }) => [x, y]);

        layout.halt();
        layout.halt();
        await new Promise(resolve => setTimeout(resolve, 50));

        expect(ended).toHaveBeenCalledTimes(1);
        expect(ticks).not.toHaveBeenCalled();
        expect(options.nodes.map(({ x, y }) => [x, y])).toEqual(halted);
        layout.stop();
    });

    it('keeps restored positions at rest and ends at once (ADR-011 A22)', async () => {
        const options = chain(3);
        for (const [index, each] of options.nodes.entries()) {
            Object.assign(each, { x: index * 100, y: 50 });
        }
        const layout = createForceLayout({ ...options, restore: { running: false } });
        const ended = vi.fn();
        const ticks = vi.fn();
        layout.onEnd(ended);
        layout.onTick(ticks);

        layout.start();
        await new Promise(resolve => setTimeout(resolve, 50));

        expect(ended).toHaveBeenCalledTimes(1);
        expect(ticks).not.toHaveBeenCalled();
        expect(options.nodes.map(({ x, y }) => [x, y])).toEqual([
            [0, 50],
            [100, 50],
            [200, 50],
        ]);
        layout.stop();
    });

    it('reports ticks to its listeners after start', async () => {
        const layout = createForceLayout(chain(3));
        const removed = vi.fn();
        layout.onTick(removed)();
        const ticked = new Promise<void>(resolve => layout.onTick(resolve));

        layout.start();
        await ticked;
        layout.stop();

        expect(removed).not.toHaveBeenCalled();
    });
});
