import { graphSettings, type ReactConstraint } from '@qualivis/core';
import {
    forceCenter,
    forceCollide,
    forceLink,
    forceManyBody,
    forceSimulation,
    type Simulation,
} from 'd3-force';
import { timed } from '../../../lib/perfStats';
import { createFlowRules } from './flow';
import type { LayoutEngine, LayoutLink, LayoutNode, LayoutRestore } from './types';

export type ForceLayoutOptions = {
    nodes: LayoutNode[];
    links: LayoutLink[];
    /** Size of the graph area; the layout centres the nodes in it. */
    width: number;
    height: number;
    /** Positions of an earlier layout of the graph to go on from (ADR-011 A22). */
    restore?: LayoutRestore;
    /**
     * "Vertical flow layout" on: the flow rules (flow.ts) with the order of the React methods in
     * a component view (core `reactConstraints`, empty in the app view).
     */
    flow?: { constraints: readonly ReactConstraint[] };
};

type ForceSimulation = Simulation<LayoutNode, LayoutLink>;

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
}: ForceLayoutOptions): ForceSimulation => {
    // The flow layout takes half the legacy minimum: about as compact as WebCola was.
    const charge = flow
        ? graphSettings.minChargeForce / 2
        : Math.min(-4000 + nodes.length * 200, graphSettings.minChargeForce);

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

/**
 * The layout engine: the legacy force layout with the legacy dragging (§11), and with `flow` the
 * setting "Vertical flow layout" (on by default). The legacy app took WebCola for that
 * (graph.component.ts:571-584), which needs seconds to start a large graph and seldom comes to
 * rest; here the flow rules correct the positions after every tick. One tick per animation
 * frame, as d3's own timer runs it.
 */
export const createForceLayout = (options: ForceLayoutOptions): LayoutEngine => {
    const simulation = createForceSimulation(options).stop();
    const { flow } = options;
    const applyRules =
        flow &&
        createFlowRules(options.nodes, options.links, flow.constraints, graphSettings.nodeGap);
    const listeners = { tick: new Set<() => void>(), end: new Set<() => void>() };
    const notify = (type: keyof typeof listeners) => {
        for (const listener of listeners[type]) {
            listener();
        }
    };
    let frame: number | undefined;
    let stopped = false;
    let dragging = false;

    const step = () => {
        frame = undefined;
        timed('layout.tick', () => {
            simulation.tick();
            applyRules?.();
        });
        notify('tick');
        if (simulation.alpha() < simulation.alphaMin()) {
            notify('end');
        } else {
            scheduleStep();
        }
    };
    const scheduleStep = () => {
        if (!stopped) {
            frame ??= requestAnimationFrame(step);
        }
    };
    const cancelStep = () => {
        if (frame !== undefined) {
            cancelAnimationFrame(frame);
            frame = undefined;
        }
    };

    return {
        start: () => {
            // A layout restored at rest ends at once with alpha 0, as after a normal end, so that
            // dragging heats it up the same way (ADR-011 A22).
            if (options.restore && !options.restore.running) {
                simulation.alpha(0);
                notify('end');
                return;
            }
            scheduleStep();
        },
        // For good: dragging does not start it again.
        stop: () => {
            stopped = true;
            cancelStep();
            listeners.tick.clear();
            listeners.end.clear();
        },
        // Without a further tick, which would still move the nodes by their velocity. Alpha 0, as
        // after a normal end, so that dragging heats the simulation up the same way.
        halt: () => {
            if (simulation.alpha() < simulation.alphaMin()) {
                return;
            }
            cancelStep();
            simulation.alpha(0);
            notify('end');
        },
        onTick: listener => {
            listeners.tick.add(listener);
            return () => listeners.tick.delete(listener);
        },
        onEnd: listener => {
            listeners.end.add(listener);
            return () => listeners.end.delete(listener);
        },
        // The legacy drag handler has no start event: the simulation reheats on the first move.
        drag: (node, { x, y }) => {
            if (!dragging) {
                simulation.alphaTarget(graphSettings.dragAlphaTarget);
                dragging = true;
            }
            scheduleStep();
            node.fx = x;
            node.fy = y;
        },
        dragEnd: (node, { pin }) => {
            simulation.alphaTarget(0);
            // Stick the node at the position if the Shift key is pressed. Legacy behaviour: in the
            // flow layout (WebCola there) Shift did not pin the node.
            if (!pin || flow) {
                node.fx = null;
                node.fy = null;
            }
            dragging = false;
        },
    };
};
