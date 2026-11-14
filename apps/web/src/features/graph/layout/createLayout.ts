import type { ReactConstraint } from '@qualivis/core';
import { createForceLayout, type ForceLayoutOptions } from './forceLayout';
import { runsInWorker } from './largeGraph';
import type { LayoutEngine } from './types';
import { createWorkerLayout } from './workerLayout';

/** Nodes, links, area size and the React method order (empty in the app view, see buildViewModel). */
export type LayoutOptions = Omit<ForceLayoutOptions, 'flow' | 'gridCollide'> & {
    constraints: readonly ReactConstraint[];
};

export type LayoutFactory = (flowLayout: boolean, options: LayoutOptions) => LayoutEngine;

/**
 * The engine of the setting "Vertical flow layout" (graph.component.ts:571-613): the force layout,
 * with the flow rules and the React method order when it is on. A large graph is laid out in a
 * web worker, where the browser has them (not in the tests).
 */
export const createLayout: LayoutFactory = (flowLayout, { constraints, ...options }) => {
    const forceOptions = flowLayout ? { ...options, flow: { constraints } } : options;
    return runsInWorker(options.nodes) && typeof Worker !== 'undefined'
        ? createWorkerLayout(forceOptions)
        : createForceLayout(forceOptions);
};
