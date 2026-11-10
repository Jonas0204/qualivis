import { describe, expect, it, vi } from 'vitest';
import { createColaLayout } from './colaLayout';
import { createLayout, type LayoutOptions } from './createLayout';
import { createForceLayout } from './forceLayout';
import type { LayoutEngine, LayoutNode } from './types';

vi.mock('./colaLayout', () => ({ createColaLayout: vi.fn(() => ({ name: 'cola' })) }));
vi.mock('./forceLayout', () => ({ createForceLayout: vi.fn(() => ({ name: 'force' })) }));

const a: LayoutNode = { id: 'a', width: 20, height: 20 };
const b: LayoutNode = { id: 'b', width: 20, height: 20 };
const options: LayoutOptions = {
    nodes: [a, b],
    links: [{ source: a, target: b }],
    width: 800,
    height: 600,
    constraints: [{ axis: 'x', left: 0, right: 1, gap: 100 }],
};
const named = (name: string) => ({ name }) as unknown as LayoutEngine;

describe('createLayout', () => {
    it('takes WebCola with the constraints when "Vertical flow layout" is on', () => {
        expect(createLayout(true, options)).toEqual(named('cola'));
        expect(createColaLayout).toHaveBeenLastCalledWith(options);
    });

    it('takes the force layout without constraints when it is off', () => {
        const { constraints: _, ...forceOptions } = options;

        expect(createLayout(false, options)).toEqual(named('force'));
        expect(createForceLayout).toHaveBeenLastCalledWith(forceOptions);
    });
});
