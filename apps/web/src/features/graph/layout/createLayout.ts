import { type ColaLayoutOptions, createColaLayout } from './colaLayout';
import { createForceLayout } from './forceLayout';
import type { LayoutEngine } from './types';

/** Nodes, links, area size and the React method order (empty in the app view, see buildViewModel). */
export type LayoutOptions = ColaLayoutOptions;

export type LayoutFactory = (colaLayout: boolean, options: LayoutOptions) => LayoutEngine;

/**
 * The engine of the setting "Vertical flow layout" (graph.component.ts:571-613): WebCola when it
 * is on, otherwise the force layout, which has no constraints.
 */
export const createLayout: LayoutFactory = (colaLayout, { constraints, ...options }) =>
    colaLayout ? createColaLayout({ ...options, constraints }) : createForceLayout(options);
