import { describe, expect, it, vi } from 'vitest';
import { createLayout, type LayoutOptions } from './createLayout';
import { createForceLayout } from './forceLayout';
import type { LayoutNode } from './types';

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
const { constraints, ...forceOptions } = options;

describe('createLayout', () => {
    it('adds the flow rules with the constraints when "Vertical flow layout" is on', () => {
        createLayout(true, options);
        expect(createForceLayout).toHaveBeenLastCalledWith({
            ...forceOptions,
            flow: { constraints },
        });
    });

    it('takes the plain force layout without constraints when it is off', () => {
        createLayout(false, options);
        expect(createForceLayout).toHaveBeenLastCalledWith(forceOptions);
    });
});
