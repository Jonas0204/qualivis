import { graphSettings, type ReactConstraint } from '@qualivis/core';
import { createFlowRules } from './flow';
import { createForceSimulation } from './forceLayout';
import type { LayoutLink, LayoutNode } from './types';

/** A node as the worker gets it: its size and, if it has one, its position and pin. */
export type HostNode = Pick<LayoutNode, 'width' | 'height' | 'x' | 'y' | 'fx' | 'fy'>;

/** What the page tells the layout worker (workerLayout.ts). Nodes go by their index. */
export type LayoutRequest =
    | {
          type: 'start';
          nodes: HostNode[];
          /** Index of source and target of every link. */
          links: [source: number, target: number][];
          width: number;
          height: number;
          flow?: { constraints: readonly ReactConstraint[] };
          /** A view restored at rest: the simulation waits with alpha 0, e.g. for dragging. */
          atRest: boolean;
      }
    | { type: 'drag'; node: number; x: number; y: number }
    | { type: 'dragEnd'; node: number; release: boolean }
    | { type: 'halt' }
    /** The page has taken the positions of the last `tick`; the next ones may come. */
    | { type: 'ack' };

/** What the worker tells the page: positions as x0, y0, x1, y1, … and the duration of its ticks. */
export type LayoutReply = {
    type: 'tick' | 'end';
    positions: Float64Array;
    tickMs: number[];
};

export type LayoutHostOptions = {
    post: (reply: LayoutReply) => void;
    /** Runs `run` after `delayMs`, without delay as soon as waiting messages are handled. */
    defer: (run: () => void, delayMs: number) => void;
    now?: () => number;
};

type Simulation = ReturnType<typeof createForceSimulation>;

const isAtRest = (simulation: Simulation) => simulation.alpha() < simulation.alphaMin();

/** Ticks per second, as on the main thread (forceLayout.ts). */
const ticksPerSecond = 240;
/** The ticks of one slice stop after this time, so that messages (dragging, halt) get their turn. */
const sliceMs = 8;
/** Wait when the simulation is ahead of its clock: about one tick. */
const idleMs = 4;

/**
 * The layout inside the web worker: the same simulation and flow rules as on the main thread
 * (forceLayout.ts), with the grid collision. It ticks by the clock, however long the page takes to
 * draw a frame, and sends the positions when the page has taken the last ones, so slow frames no
 * longer slow the layout down (P08-S09). Returns the handler for the messages of the page.
 */
export const createLayoutHost = ({
    post,
    defer,
    now = () => performance.now(),
}: LayoutHostOptions): ((request: LayoutRequest) => void) => {
    let nodes: LayoutNode[] = [];
    let simulation: Simulation | undefined;
    let applyRules: (() => void) | undefined;
    let scheduled = false;
    let awaitingAck = false;
    let dragging = false;
    let lastSliceAt: number | undefined;
    let dueTicks = 0;
    let tickMs: number[] = [];
    let moved = false;

    const send = (type: LayoutReply['type']) => {
        const positions = new Float64Array(nodes.length * 2);
        nodes.forEach((node, index) => {
            positions[index * 2] = node.x ?? 0;
            positions[index * 2 + 1] = node.y ?? 0;
        });
        post({ type, positions, tickMs });
        tickMs = [];
        moved = false;
        awaitingAck = type === 'tick';
    };

    const resetClock = () => {
        lastSliceAt = undefined;
        dueTicks = 0;
    };

    const schedule = (delayMs: number) => {
        if (!scheduled) {
            scheduled = true;
            defer(slice, delayMs);
        }
    };

    /** Ticks what the clock asks for, at most for the time of a slice; true at the end. */
    const tickDue = (simulation: Simulation): boolean => {
        const startedAt = now();
        dueTicks =
            lastSliceAt === undefined
                ? 1
                : dueTicks + ((startedAt - lastSliceAt) * ticksPerSecond) / 1000;
        lastSliceAt = startedAt;
        let tickedAt = startedAt;
        while (dueTicks >= 1) {
            simulation.tick();
            applyRules?.();
            dueTicks--;
            moved = true;
            const endedAt = now();
            tickMs.push(endedAt - tickedAt);
            tickedAt = endedAt;
            if (isAtRest(simulation) || endedAt - startedAt > sliceMs) {
                break;
            }
        }
        return moved && isAtRest(simulation);
    };

    const slice = () => {
        scheduled = false;
        if (!simulation) {
            return;
        }
        if (tickDue(simulation)) {
            resetClock();
            send('end');
            return;
        }
        if (moved && !awaitingAck) {
            send('tick');
        }
        schedule(dueTicks >= 1 ? 0 : idleMs);
    };

    const start = (request: Extract<LayoutRequest, { type: 'start' }>) => {
        nodes = request.nodes.map((node, index) => ({ ...node, id: String(index) }));
        const links = request.links.flatMap(([source, target]): LayoutLink[] => {
            const from = nodes[source];
            const to = nodes[target];
            return from && to ? [{ source: from, target: to }] : [];
        });
        const { width, height, flow } = request;
        simulation = createForceSimulation({
            nodes,
            links,
            width,
            height,
            flow,
            gridCollide: true,
        }).stop();
        applyRules = flow && createFlowRules(nodes, links, flow.constraints, graphSettings.nodeGap);
        if (request.atRest) {
            simulation.alpha(0);
        } else {
            schedule(0);
        }
    };

    const halt = (simulation: Simulation) => {
        if (!isAtRest(simulation)) {
            simulation.alpha(0);
            resetClock();
            send('end');
        }
    };

    const drag = (simulation: Simulation, node: LayoutNode, x: number, y: number) => {
        // As on the main thread: the simulation reheats on the first move.
        if (!dragging) {
            simulation.alphaTarget(graphSettings.dragAlphaTarget);
            dragging = true;
        }
        node.fx = x;
        node.fy = y;
        schedule(0);
    };

    const dragEnd = (simulation: Simulation, node: LayoutNode, release: boolean) => {
        simulation.alphaTarget(0);
        if (release) {
            node.fx = null;
            node.fy = null;
        }
        dragging = false;
    };

    return request => {
        if (request.type === 'start') {
            start(request);
            return;
        }
        if (!simulation) {
            return;
        }
        switch (request.type) {
            case 'ack':
                awaitingAck = false;
                break;
            case 'halt':
                halt(simulation);
                break;
            case 'drag': {
                const node = nodes[request.node];
                if (node) {
                    drag(simulation, node, request.x, request.y);
                }
                break;
            }
            case 'dragEnd': {
                const node = nodes[request.node];
                if (node) {
                    dragEnd(simulation, node, request.release);
                }
                break;
            }
        }
    };
};
