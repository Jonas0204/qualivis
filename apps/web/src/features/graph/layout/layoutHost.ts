import type { ReactConstraint } from '@qualivis/core';
import { createForceSolver } from './forceSolver';
import { createTickClock } from './tickClock';
import type { LayoutLink, LayoutNode, LayoutSolver } from './types';

/** A node as the worker gets it: its size and, if it has one, its position and pin. */
type HostNode = Pick<LayoutNode, 'width' | 'height' | 'x' | 'y' | 'fx' | 'fy'>;

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
          /** A view restored at rest: the layout waits, e.g. for dragging. */
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

/** The ticks of one slice stop after this time, so that messages (dragging, halt) get their turn. */
const sliceMs = 8;
/** Wait when the solver is ahead of its clock: about one tick. */
const idleMs = 4;

/**
 * The layout inside the web worker: the same solver as on the main thread (forceSolver.ts), with
 * the grid collision, by the same clock (tickClock.ts). It ticks however long the page takes to
 * draw a frame, and sends the positions when the page has taken the last ones, so slow frames no
 * longer slow the layout down (P08-S09). Returns the handler for the messages of the page.
 */
export const createLayoutHost = ({
    post,
    defer,
    now = () => performance.now(),
}: LayoutHostOptions): ((request: LayoutRequest) => void) => {
    const clock = createTickClock();
    let nodes: LayoutNode[] = [];
    let solver: LayoutSolver | undefined;
    let scheduled = false;
    let awaitingAck = false;
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

    const schedule = (delayMs: number) => {
        if (!scheduled) {
            scheduled = true;
            defer(slice, delayMs);
        }
    };

    const slice = () => {
        scheduled = false;
        if (!solver) {
            return;
        }
        const startedAt = now();
        clock.advance(startedAt);
        const ticks = clock.run(solver, {
            now,
            startedAt,
            budgetMs: sliceMs,
            record: ms => tickMs.push(ms),
        });
        moved ||= ticks > 0;
        if (moved && solver.atRest()) {
            clock.reset();
            send('end');
            return;
        }
        if (moved && !awaitingAck) {
            send('tick');
        }
        schedule(clock.hasDue() ? 0 : idleMs);
    };

    const start = (request: Extract<LayoutRequest, { type: 'start' }>) => {
        nodes = request.nodes.map((node, index) => ({ ...node, id: String(index) }));
        const links = request.links.flatMap(([source, target]): LayoutLink[] => {
            const from = nodes[source];
            const to = nodes[target];
            return from && to ? [{ source: from, target: to }] : [];
        });
        const { width, height, flow } = request;
        solver = createForceSolver({ nodes, links, width, height, flow, gridCollide: true });
        if (request.atRest) {
            solver.freeze();
        } else {
            schedule(0);
        }
    };

    return request => {
        if (request.type === 'start') {
            start(request);
            return;
        }
        if (!solver) {
            return;
        }
        switch (request.type) {
            case 'ack':
                awaitingAck = false;
                break;
            case 'halt':
                if (!solver.atRest()) {
                    solver.freeze();
                    clock.reset();
                    send('end');
                }
                break;
            case 'drag': {
                const node = nodes[request.node];
                if (node) {
                    solver.hold(node, request.x, request.y);
                    schedule(0);
                }
                break;
            }
            case 'dragEnd': {
                const node = nodes[request.node];
                if (node) {
                    solver.release(node, request.release);
                }
                break;
            }
        }
    };
};
