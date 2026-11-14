import { describe, expect, it } from 'vitest';
import { createFlowRules } from './flow';
import type { LayoutLink, LayoutNode } from './types';

const at = (id: string, x: number, y: number): LayoutNode => ({ id, width: 20, height: 20, x, y });

describe('createFlowRules', () => {
    it('puts every target at least the gap below its source, also along a chain', () => {
        const a = at('a', 0, 300);
        const b = at('b', 0, 200);
        const c = at('c', 0, 100);
        const links: LayoutLink[] = [
            { source: b, target: c },
            { source: a, target: b },
        ];

        createFlowRules([a, b, c], links, [], 100)();

        expect((b.y ?? 0) - (a.y ?? 0)).toBeGreaterThanOrEqual(100);
        expect((c.y ?? 0) - (b.y ?? 0)).toBeGreaterThanOrEqual(100);
    });

    it('leaves out the links inside a cycle, like WebCola', () => {
        const a = at('a', 0, 0);
        const b = at('b', 0, 0);
        const c = at('c', 0, 0);
        const links: LayoutLink[] = [
            { source: a, target: b },
            { source: b, target: a },
            { source: b, target: c },
        ];

        createFlowRules([a, b, c], links, [], 100)();

        expect(a.y).toBe(0);
        expect(Math.abs((b.y ?? 0) - (a.y ?? 0))).toBeLessThan(100);
        expect((c.y ?? 0) - (b.y ?? 0)).toBeGreaterThanOrEqual(100);
    });

    it('moves both ends of a link apart, not only the target', () => {
        const a = at('a', 0, 0);
        const b = at('b', 0, 0);

        createFlowRules([a, b], [{ source: a, target: b }], [], 100)();

        expect(a.y).toBeLessThan(0);
        expect((b.y ?? 0) - (a.y ?? 0)).toBeGreaterThanOrEqual(100);
    });

    it('keeps the React methods in order from left to right', () => {
        const nodes = [at('constructor', 50, 0), at('render', 0, 0), at('helper', 0, 0)];

        createFlowRules(nodes, [], [{ axis: 'x', left: 0, right: 1, gap: 100 }], 100)();

        // render is 100 to the right of the constructor, and the three stay around the same centre.
        expect(nodes.map(node => node.x)).toEqual([0, 100, -50]);
    });

    it('does not move the graph as a whole, although it pushes the targets down', () => {
        const nodes = [at('a', 0, 40), at('b', 0, 30), at('c', 0, 20), at('d', 0, 10)];
        const [a, b, c, d] = nodes as [LayoutNode, LayoutNode, LayoutNode, LayoutNode];
        const links: LayoutLink[] = [
            { source: a, target: b },
            { source: b, target: c },
            { source: c, target: d },
        ];
        const rules = createFlowRules(nodes, links, [], 100);
        const mean = () => nodes.reduce((sum, node) => sum + (node.y ?? 0), 0) / nodes.length;

        // As the forces do in every tick of a hot layout: pull the chain together again.
        for (let tick = 0; tick < 50; tick++) {
            nodes.forEach((node, index) => {
                node.y = 40 - index * 10;
            });
            rules();
        }

        expect(mean()).toBeCloseTo(25);
        expect(nodes.map(node => Math.round(node.y ?? 0))).toEqual([-125, -25, 75, 175]);
    });

    it('keeps the rules next to a dragged node, which stays where it is', () => {
        const a = at('a', 0, 0);
        const dragged = { ...at('dragged', 0, 0), fx: 0, fy: 0 };
        const c = at('c', 0, 0);
        const links: LayoutLink[] = [
            { source: a, target: dragged },
            { source: dragged, target: c },
        ];

        createFlowRules([a, dragged, c], links, [], 100)();

        expect(dragged.y).toBe(0);
        expect(c.y).toBeGreaterThanOrEqual(100);
        expect(a.y).toBeLessThan(0);
    });

    it('does not move a dragged node', () => {
        const a = at('a', 0, 0);
        const b = { ...at('b', 0, 0), fx: 0, fy: 0 };

        createFlowRules([a, b], [{ source: a, target: b }], [], 100)();

        expect(b.y).toBe(0);
    });
});
