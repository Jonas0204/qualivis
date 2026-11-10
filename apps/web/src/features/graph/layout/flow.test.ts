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

        expect(nodes.map(node => node.x)).toEqual([50, 150, 0]);
    });

    it('does not move a dragged node', () => {
        const a = at('a', 0, 0);
        const b = { ...at('b', 0, 0), fx: 0, fy: 0 };

        createFlowRules([a, b], [{ source: a, target: b }], [], 100)();

        expect(b.y).toBe(0);
    });
});
