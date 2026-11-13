import { afterEach, describe, expect, it, vi } from 'vitest';
import { createLayout, type LayoutOptions } from './createLayout';
import { createForceLayout } from './forceLayout';
import { largeGraph } from './largeGraph';
import type { LayoutNode } from './types';
import { createWorkerLayout } from './workerLayout';

vi.mock('./forceLayout', () => ({ createForceLayout: vi.fn(() => ({ name: 'force' })) }));
vi.mock('./workerLayout', () => ({ createWorkerLayout: vi.fn(() => ({ name: 'worker' })) }));

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

const manyNodes = (count: number): LayoutNode[] =>
    Array.from({ length: count }, (_, index) => ({ id: `n${index}`, width: 20, height: 20 }));

describe('createLayout', () => {
    afterEach(() => {
        vi.unstubAllGlobals();
        vi.clearAllMocks();
    });

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

    it('lays out a large graph in a web worker, with the same options', () => {
        vi.stubGlobal('Worker', class {});
        const large = { ...options, nodes: manyNodes(largeGraph.workerNodes) };
        const { constraints: _, ...largeOptions } = large;

        expect(createLayout(true, large)).toEqual({ name: 'worker' });
        expect(createWorkerLayout).toHaveBeenLastCalledWith({
            ...largeOptions,
            flow: { constraints },
        });

        createLayout(true, { ...options, nodes: manyNodes(largeGraph.workerNodes - 1) });
        expect(createWorkerLayout).toHaveBeenCalledTimes(1);
        expect(createForceLayout).toHaveBeenCalledTimes(1);
    });

    it('lays out a large graph on the main thread where there are no web workers', () => {
        vi.stubGlobal('Worker', undefined);

        createLayout(false, { ...options, nodes: manyNodes(largeGraph.workerNodes) });

        expect(createWorkerLayout).not.toHaveBeenCalled();
        expect(createForceLayout).toHaveBeenCalledTimes(1);
    });
});
