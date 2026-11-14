import { forceCollide, forceSimulation } from 'd3-force';
import { describe, expect, it } from 'vitest';
import { forceGridCollide } from './gridCollide';
import type { LayoutNode } from './types';

const radius = (node: LayoutNode) => node.width / 2;

/** Nodes of different sizes, crowded on a small area so that many overlap. */
const crowd = (count: number): LayoutNode[] =>
    Array.from({ length: count }, (_, index) => ({
        id: `n${index}`,
        width: 20 + (index % 5) * 12,
        height: 20,
        x: (index % 17) * 9,
        y: Math.floor(index / 17) * 9,
    }));

const overlaps = (nodes: readonly LayoutNode[]) => {
    let count = 0;
    nodes.forEach((a, i) => {
        for (const b of nodes.slice(i + 1)) {
            const distance = Math.hypot((a.x ?? 0) - (b.x ?? 0), (a.y ?? 0) - (b.y ?? 0));
            // A little slack: the force comes to rest just before the circles stop touching.
            if (distance < (radius(a) + radius(b)) * 0.98) {
                count++;
            }
        }
    });
    return count;
};

const settle = (
    nodes: LayoutNode[],
    collide: Parameters<ReturnType<typeof forceSimulation<LayoutNode>>['force']>[1]
) => {
    const simulation = forceSimulation(nodes).force('collide', collide).stop();
    simulation.tick(300);
    return nodes;
};

describe('forceGridCollide', () => {
    it('moves overlapping circles apart until none overlap, like d3', () => {
        expect(overlaps(crowd(300))).toBeGreaterThan(1000);

        const grid = settle(crowd(300), forceGridCollide(radius));
        const d3 = settle(crowd(300), forceCollide<LayoutNode>().radius(radius));

        expect(overlaps(grid)).toBe(0);
        expect(overlaps(d3)).toBe(0);
    });

    it('pushes two circles apart by the same amounts as d3, the larger one less', () => {
        const pair = (): LayoutNode[] => [
            { id: 'small', width: 20, height: 20, x: 0, y: 0 },
            { id: 'large', width: 60, height: 60, x: 10, y: 5 },
        ];
        const tick = (nodes: LayoutNode[], collide: Parameters<typeof settle>[1]) => {
            forceSimulation(nodes).force('collide', collide).stop().tick();
            return nodes.map(({ x, y }) => [x, y]);
        };

        expect(tick(pair(), forceGridCollide(radius))).toEqual(
            tick(pair(), forceCollide<LayoutNode>().radius(radius))
        );
    });

    it('moves two circles on the same spot apart', () => {
        const nodes = settle(
            [
                { id: 'a', width: 20, height: 20, x: 5, y: 5 },
                { id: 'b', width: 20, height: 20, x: 5, y: 5 },
            ],
            forceGridCollide(radius)
        );

        expect(overlaps(nodes)).toBe(0);
    });

    it('leaves circles that do not overlap where they are', () => {
        const nodes = settle(
            [
                { id: 'a', width: 20, height: 20, x: 0, y: 0 },
                { id: 'b', width: 20, height: 20, x: 500, y: -300 },
            ],
            forceGridCollide(radius)
        );

        expect(nodes.map(({ x, y }) => [x, y])).toEqual([
            [0, 0],
            [500, -300],
        ]);
    });
});
