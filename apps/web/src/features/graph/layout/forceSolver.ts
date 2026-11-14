import { graphSettings, type ReactConstraint } from '@qualivis/core';
import {
    forceCenter,
    forceCollide,
    forceLink,
    forceManyBody,
    forceSimulation,
    type Simulation,
} from 'd3-force';
import { createFlowRules } from './flow';
import { forceGridCollide } from './gridCollide';
import type { LayoutLink, LayoutNode, LayoutSolver } from './types';

export type ForceSolverOptions = {
    nodes: LayoutNode[];
    links: LayoutLink[];
    /** Size of the graph area; the layout centres the nodes in it. */
    width: number;
    height: number;
    /**
     * "Vertical flow layout" on: the flow rules (flow.ts) with the order of the React methods in
     * a component view (core `reactConstraints`, empty in the app view).
     */
    flow?: { constraints: readonly ReactConstraint[] };
    /** The collision force with a grid (gridCollide.ts) instead of d3's: for large graphs. */
    gridCollide?: boolean;
};

/**
 * Takes the speed that all free nodes have in common along y out of the flow layout. The link
 * force of d3 moves the end with fewer links more, so the two pulls of a link do not cancel out.
 * In the flow layout every link points down and is stretched, and targets tend to have more links
 * than sources (shared components), so in sum the links push the whole graph down, the more the
 * hotter the layout is: the graph sank while a node was held, and rose again afterwards.
 */
const forceNoDrift = (nodes: readonly LayoutNode[]) => () => {
    let sum = 0;
    let count = 0;
    for (const node of nodes) {
        if (node.fy == null) {
            sum += node.vy ?? 0;
            count++;
        }
    }
    if (count === 0) {
        return;
    }
    const drift = sum / count;
    for (const node of nodes) {
        if (node.fy == null) {
            node.vy = (node.vy ?? 0) - drift;
        }
    }
};

/**
 * The d3 force simulation with the legacy parameters (graph.component.ts:587-611,
 * docs/migration/01-referenz-altsystem/03-visuelle-regeln.md §9.3). It starts running at once.
 */
export const createForceSimulation = ({
    nodes,
    links,
    width,
    height,
    flow,
    gridCollide = false,
}: ForceSolverOptions): Simulation<LayoutNode, LayoutLink> => {
    // The flow layout takes half the legacy minimum: about as compact as WebCola was.
    const charge = flow
        ? graphSettings.minChargeForce / 2
        : Math.min(-4000 + nodes.length * 200, graphSettings.minChargeForce);
    const collisionRadius = (node: LayoutNode) => (node.width / 2) * 1.2;

    const simulation = forceSimulation(nodes)
        // The links already hold node objects (generateLinkReferences), so no .id() accessor.
        .force(
            'link',
            forceLink<LayoutNode, LayoutLink>(links).distance(graphSettings.linkDistance)
        )
        .force('charge', forceManyBody<LayoutNode>().strength(charge))
        .force('center', forceCenter(width / 2, height / 2))
        .force(
            'collide',
            gridCollide
                ? forceGridCollide(collisionRadius)
                : forceCollide<LayoutNode>().radius(collisionRadius)
        );
    // After the other forces, so that it takes out what they added in this tick.
    return flow ? simulation.force('drift', forceNoDrift(nodes)) : simulation;
};

/**
 * Whether a dragged node is free again when the pointer lets go: unless Shift pinned it. Legacy
 * behaviour: in the flow layout (WebCola there) Shift did not pin the node.
 */
export const freedAfterDrag = (pin: boolean, flow: ForceSolverOptions['flow']): boolean =>
    !pin || flow !== undefined;

/**
 * The legacy force layout with the legacy dragging (§11), and with `flow` the setting "Vertical
 * flow layout" (on by default). The legacy app took WebCola for that (graph.component.ts:571-584),
 * which needs seconds to start a large graph and seldom comes to rest; here the flow rules correct
 * the positions after every tick. "At rest" is d3's alpha below its minimum.
 */
export const createForceSolver = (options: ForceSolverOptions): LayoutSolver => {
    const simulation = createForceSimulation(options).stop();
    const { flow } = options;
    const applyRules =
        flow &&
        createFlowRules(options.nodes, options.links, flow.constraints, graphSettings.nodeGap);
    let holding = false;

    return {
        tick: () => {
            simulation.tick();
            applyRules?.();
        },
        atRest: () => simulation.alpha() < simulation.alphaMin(),
        // The legacy drag handler has no start event: the simulation reheats on the first move.
        hold: (node, x, y) => {
            if (!holding) {
                simulation.alphaTarget(graphSettings.dragAlphaTarget);
                holding = true;
            }
            node.fx = x;
            node.fy = y;
        },
        release: (node, free) => {
            simulation.alphaTarget(0);
            if (free) {
                node.fx = null;
                node.fy = null;
            }
            holding = false;
        },
        // Alpha 0, as after a normal end, so that dragging heats the simulation up the same way.
        freeze: () => {
            simulation.alpha(0);
        },
    };
};
