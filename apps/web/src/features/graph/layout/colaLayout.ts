import { graphSettings, type ReactConstraint } from '@qualivis/core';
// Only the layout module: the package root also loads the d3 adaptors and d3 v1 (ADR-003).
import {
    type Event as ColaEvent,
    type Link as ColaLink,
    type Node as ColaNode,
    EventType,
    Layout,
} from 'webcola/dist/src/layout';
import type { LayoutEngine, LayoutLink, LayoutNode } from './types';

export type ColaLayoutOptions = {
    nodes: LayoutNode[];
    links: LayoutLink[];
    /** Size of the graph area. */
    width: number;
    height: number;
    /** Order of the React methods in a component view (core `reactConstraints`). */
    constraints: readonly ReactConstraint[];
};

type Listener = () => void;

/**
 * WebCola layout animated with requestAnimationFrame instead of d3-timer (ADR-003). Like the d3
 * adaptor (webcola/dist/src/d3v4adaptor.js), it runs one tick per frame until the layout
 * converges.
 */
class AnimatedColaLayout extends Layout {
    private frame: number | undefined;
    private cancelled = false;
    private readonly listeners = { tick: new Set<Listener>(), end: new Set<Listener>() };

    /** Returns a function that removes the listener. */
    addListener(type: 'tick' | 'end', listener: Listener): () => void {
        this.listeners[type].add(listener);
        return () => {
            this.listeners[type].delete(listener);
        };
    }

    /** Stops the animation for good: a later `resume()` does not start it again. */
    cancel(): void {
        this.cancelled = true;
        if (this.frame !== undefined) {
            cancelAnimationFrame(this.frame);
            this.frame = undefined;
        }
        this.listeners.tick.clear();
        this.listeners.end.clear();
    }

    protected override trigger(event: ColaEvent): void {
        const listeners =
            event.type === EventType.tick
                ? this.listeners.tick
                : event.type === EventType.end
                  ? this.listeners.end
                  : undefined;
        for (const listener of listeners ?? []) {
            listener();
        }
    }

    /** WebCola calls this when the layout starts or resumes after it came to rest. */
    protected override kick(): void {
        if (this.cancelled || this.frame !== undefined) {
            return;
        }
        const step = () => {
            this.frame = undefined;
            // tick() is true once the layout has converged; it has reported the end then.
            if (!this.tick()) {
                this.frame ??= requestAnimationFrame(step);
            }
        };
        this.frame = requestAnimationFrame(step);
    }
}

// WebCola's types want nodes with a position; its start() gives every node without one the centre
// of the area first (webcola/dist/src/layout.js:291-297).
const colaNode = (node: LayoutNode): ColaNode => node as ColaNode;

const colaLink = ({ source, target }: LayoutLink): ColaLink<ColaNode> => ({
    source: colaNode(source),
    target: colaNode(target),
});

/**
 * Layout engine for the setting "Vertical flow layout" (on by default): WebCola with the legacy
 * parameters (graph.component.ts:571-584, docs/migration/01-referenz-altsystem/03-visuelle-regeln.md
 * §9.1) and the legacy dragging (§11).
 */
export const createColaLayout = ({
    nodes,
    links,
    width,
    height,
    constraints,
}: ColaLayoutOptions): LayoutEngine => {
    const layout = new AnimatedColaLayout();
    let startFrame: number | undefined;

    return {
        // The first layout runs in the next frame, as the legacy app started it in a timeout
        // (graph.component.ts:173). An engine that is stopped before (React StrictMode runs the
        // effect twice) leaves the nodes untouched, so the next engine starts from scratch.
        start: () => {
            startFrame = requestAnimationFrame(() => {
                startFrame = undefined;
                layout
                    .size([width, height])
                    .nodes(nodes)
                    .links(links.map(colaLink))
                    .constraints([...constraints])
                    .avoidOverlaps(true)
                    .flowLayout('y', graphSettings.nodeGap)
                    .symmetricDiffLinkLengths(40, 0.7)
                    .start(40, 20, 20);
            });
        },
        stop: () => {
            if (startFrame !== undefined) {
                cancelAnimationFrame(startFrame);
                startFrame = undefined;
            }
            layout.cancel();
        },
        onTick: listener => layout.addListener('tick', listener),
        onEnd: listener => layout.addListener('end', listener),
        dragStart: node => {
            Layout.dragStart(colaNode(node));
        },
        drag: (node, position) => {
            Layout.drag(colaNode(node), position);
            layout.resume();
        },
        // Legacy behaviour: the drag of the WebCola d3 adaptor cannot pin a node with Shift.
        dragEnd: node => {
            Layout.dragEnd(node);
        },
    };
};
