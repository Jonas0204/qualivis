import type { ReactConstraint } from '@qualivis/core';
import { createForceLayout, type ForceLayoutOptions } from './forceLayout';
import type { LayoutEngine } from './types';

/** Nodes, links, area size and the React method order (empty in the app view, see buildViewModel). */
export type LayoutOptions = Omit<ForceLayoutOptions, 'flow'> & {
    constraints: readonly ReactConstraint[];
};

export type LayoutFactory = (flowLayout: boolean, options: LayoutOptions) => LayoutEngine;

/**
 * The engine of the setting "Vertical flow layout" (graph.component.ts:571-613): the force layout,
 * with the flow rules and the React method order when it is on.
 */
export const createLayout: LayoutFactory = (flowLayout, { constraints, ...options }) =>
    createForceLayout(flowLayout ? { ...options, flow: { constraints } } : options);
