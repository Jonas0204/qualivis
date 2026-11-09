import { graphSettings } from '@qualivis/core';
import {
    forceCenter,
    forceCollide,
    forceLink,
    forceManyBody,
    forceSimulation,
    type Simulation,
} from 'd3-force';
import type { LayoutEngine, LayoutLink, LayoutNode } from './types';

export type ForceLayoutOptions = {
    nodes: LayoutNode[];
    links: LayoutLink[];
    /** Size of the graph area; the layout centres the nodes in it. */
    width: number;
    height: number;
    /** Charge strength; by default it depends on the node count. */
    force?: number;
};

export type ForceSimulation = Simulation<LayoutNode, LayoutLink>;

/**
 * The d3 force simulation with the legacy parameters (graph.component.ts:587-611,
 * docs/migration/01-referenz-altsystem/03-visuelle-regeln.md §9.3). It starts running at once.
 */
export const createForceSimulation = ({
    nodes,
    links,
    width,
    height,
    force,
}: ForceLayoutOptions): ForceSimulation => {
    const charge = force ?? Math.min(-4000 + nodes.length * 200, graphSettings.minChargeForce);

    return (
        forceSimulation(nodes)
            // The links already hold node objects (generateLinkReferences), so no .id() accessor.
            .force(
                'link',
                forceLink<LayoutNode, LayoutLink>(links).distance(graphSettings.linkDistance)
            )
            .force('charge', forceManyBody<LayoutNode>().strength(charge))
            .force('center', forceCenter(width / 2, height / 2))
            .force(
                'collide',
                forceCollide<LayoutNode>().radius(node => (node.width / 2) * 1.2)
            )
    );
};

/** Layout engine for the force layout ("Vertical flow layout" off), with legacy dragging (§11). */
export const createForceLayout = (options: ForceLayoutOptions): LayoutEngine => {
    const simulation = createForceSimulation(options).stop();
    const tickListeners = new Set<() => void>();
    const endListeners = new Set<() => void>();
    let dragging = false;

    simulation.on('tick.qv', () => {
        for (const listener of tickListeners) {
            listener();
        }
    });
    simulation.on('end.qv', () => {
        for (const listener of endListeners) {
            listener();
        }
    });

    return {
        start: () => {
            simulation.restart();
        },
        stop: () => {
            simulation.stop().on('tick.qv', null).on('end.qv', null);
            tickListeners.clear();
            endListeners.clear();
        },
        onTick: listener => {
            tickListeners.add(listener);
            return () => tickListeners.delete(listener);
        },
        onEnd: listener => {
            endListeners.add(listener);
            return () => endListeners.delete(listener);
        },
        // The legacy drag handler has no start event: the simulation reheats on the first move.
        dragStart: () => {},
        drag: (node, { x, y }) => {
            if (!dragging) {
                simulation.alphaTarget(graphSettings.dragAlphaTarget).restart();
                dragging = true;
            }
            node.fx = x;
            node.fy = y;
        },
        dragEnd: (node, { pin }) => {
            simulation.alphaTarget(0);
            // stick node at the position if the shift key is pressed
            if (!pin) {
                node.fx = null;
                node.fy = null;
            }
            dragging = false;
        },
    };
};
