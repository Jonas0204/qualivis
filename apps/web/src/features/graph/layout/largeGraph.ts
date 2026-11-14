import type { LayoutNode } from './types';

/**
 * From these sizes on a graph is "large": it is laid out and drawn in a way that costs less per
 * frame (P08-S09). Smaller graphs keep the legacy way, one tick loop on the main thread and one
 * SVG line per link, which is fast enough for them.
 */
export const largeGraph = {
    /** Nodes from which the layout runs in a web worker with the grid collision. */
    workerNodes: 300,
    /** Links from which all links are drawn as a few SVG paths instead of one line each. */
    bundledLinks: 500,
};

export const runsInWorker = (nodes: readonly LayoutNode[]): boolean =>
    nodes.length >= largeGraph.workerNodes;

export const bundlesLinks = (links: readonly unknown[]): boolean =>
    links.length >= largeGraph.bundledLinks;
