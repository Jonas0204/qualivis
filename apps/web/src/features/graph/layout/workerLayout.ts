import { forceSimulation } from 'd3-force';
import { recordDuration } from '../../../lib/perfStats';
import type { ForceLayoutOptions } from './forceLayout';
import type { LayoutReply, LayoutRequest } from './layoutHost';
import type { LayoutEngine, LayoutNode } from './types';

/** The part of a web worker the layout uses; tests pass a fake one. */
export type LayoutWorker = {
    postMessage: (request: LayoutRequest) => void;
    terminate: () => void;
    onmessage: ((event: { data: LayoutReply }) => void) | null;
};

export const startLayoutWorker = (): LayoutWorker => {
    const worker = new Worker(new URL('./layoutWorker.ts', import.meta.url), { type: 'module' });
    const layoutWorker: LayoutWorker = {
        postMessage: request => worker.postMessage(request),
        terminate: () => worker.terminate(),
        onmessage: null,
    };
    worker.onmessage = (event: MessageEvent<LayoutReply>) => layoutWorker.onmessage?.(event);
    return layoutWorker;
};

/**
 * The layout engine for large graphs: the simulation runs in a web worker (layoutHost.ts), so its
 * ticks do not wait for the frames of the page and the page stays responsive (P08-S09). The worker
 * sends positions; they go into the nodes here, and the listeners hear of them like of the ticks
 * of the engine on the main thread (forceLayout.ts). Dragging and halting are messages to the
 * worker, so their effect shows a moment later.
 */
export const createWorkerLayout = (
    options: ForceLayoutOptions,
    startWorker: () => LayoutWorker = startLayoutWorker
): LayoutEngine => {
    const { nodes, flow, restore } = options;
    // The start positions of d3, at once: the graph is drawn before the worker answers.
    forceSimulation(nodes).stop();
    const indexOf = new Map(nodes.map((node, index) => [node, index]));
    const listeners = { tick: new Set<() => void>(), end: new Set<() => void>() };
    const notify = (type: keyof typeof listeners) => {
        for (const listener of listeners[type]) {
            listener();
        }
    };
    let worker: LayoutWorker | undefined = startWorker();
    let atRest = false;
    let ackFrame: number | undefined;

    const take = ({ type, positions, tickMs }: LayoutReply) => {
        nodes.forEach((node, index) => {
            node.x = positions[index * 2] ?? node.x;
            node.y = positions[index * 2 + 1] ?? node.y;
        });
        for (const ms of tickMs) {
            recordDuration('layout.tick', ms);
        }
        notify('tick');
        if (type === 'end') {
            atRest = true;
            notify('end');
            return;
        }
        // The next positions come when this frame is drawn: at most one message per frame.
        ackFrame ??= requestAnimationFrame(() => {
            ackFrame = undefined;
            worker?.postMessage({ type: 'ack' });
        });
    };
    worker.onmessage = event => {
        if (worker) {
            take(event.data);
        }
    };

    const nodeIndex = (node: LayoutNode) => indexOf.get(node);

    return {
        start: () => {
            atRest = restore !== undefined && !restore.running;
            worker?.postMessage({
                type: 'start',
                nodes: nodes.map(({ width, height, x, y, fx, fy }) => ({
                    width,
                    height,
                    x,
                    y,
                    fx,
                    fy,
                })),
                links: options.links.flatMap(({ source, target }) => {
                    const from = nodeIndex(source);
                    const to = nodeIndex(target);
                    return from === undefined || to === undefined ? [] : [[from, to]];
                }),
                width: options.width,
                height: options.height,
                flow,
                atRest,
            });
            // A layout restored at rest ends at once (ADR-011 A22), as on the main thread.
            if (atRest) {
                notify('end');
            }
        },
        // For good: dragging does not start it again.
        stop: () => {
            worker?.terminate();
            worker = undefined;
            if (ackFrame !== undefined) {
                cancelAnimationFrame(ackFrame);
                ackFrame = undefined;
            }
            listeners.tick.clear();
            listeners.end.clear();
        },
        // The worker answers with the end.
        halt: () => {
            if (!atRest) {
                worker?.postMessage({ type: 'halt' });
            }
        },
        onTick: listener => {
            listeners.tick.add(listener);
            return () => listeners.tick.delete(listener);
        },
        onEnd: listener => {
            listeners.end.add(listener);
            return () => listeners.end.delete(listener);
        },
        drag: (node, { x, y }) => {
            const index = nodeIndex(node);
            if (index === undefined) {
                return;
            }
            atRest = false;
            node.fx = x;
            node.fy = y;
            worker?.postMessage({ type: 'drag', node: index, x, y });
        },
        dragEnd: (node, { pin }) => {
            const index = nodeIndex(node);
            if (index === undefined) {
                return;
            }
            // Legacy behaviour: in the flow layout (WebCola there) Shift did not pin the node.
            const release = !pin || flow !== undefined;
            if (release) {
                node.fx = null;
                node.fy = null;
            }
            worker?.postMessage({ type: 'dragEnd', node: index, release });
        },
    };
};
