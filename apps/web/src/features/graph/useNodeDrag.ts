import { type PointerEvent as ReactPointerEvent, useCallback, useEffect, useRef } from 'react';
import type { LayoutEngine, LayoutNode } from './layout/types';
import { suppressNextClick, svgPoint, trackPointer } from './pointerGesture';
import { invert, type ZoomTransform } from './zoomMath';

export type NodeDragOptions = {
    /** The running layout engine; dragging does nothing without one. */
    getEngine: () => LayoutEngine | undefined;
    getTransform: () => ZoomTransform;
    /** Reports when a drag starts and ends; no fading while dragging. */
    onDraggingChange?: (dragging: boolean) => void;
};

export type NodeDrag = {
    onPointerDown: (node: LayoutNode, event: ReactPointerEvent<SVGGElement>) => void;
};

type RunningDrag = {
    /** Stops following the pointer. */
    stop: () => void;
    /** Stops following the pointer and ends the drag without pinning the node. */
    cancel: () => void;
};

/**
 * Drags nodes like d3-drag 1.x did in the legacy app (graph.component.ts:703-708, 1091-1120): the
 * node keeps its offset to the pointer, the engine reacts as in its legacy drag handler. The drag
 * starts with the first move, so a pointer down without a move stays a click.
 */
export const useNodeDrag = ({
    getEngine,
    getTransform,
    onDraggingChange,
}: NodeDragOptions): NodeDrag => {
    const runningRef = useRef<RunningDrag>(undefined);

    useEffect(() => () => runningRef.current?.stop(), []);

    const onPointerDown = useCallback(
        (node: LayoutNode, event: ReactPointerEvent<SVGGElement>) => {
            // d3-drag default filter: left button only, without Ctrl (Ctrl+click removes the node).
            const svg = event.currentTarget.ownerSVGElement;
            if (event.ctrlKey || event.button !== 0 || !svg) {
                return;
            }
            // No pan: d3-drag stops the mouse down at the node.
            event.stopPropagation();

            // A second finger or pen on another node ends the running drag first. Otherwise its
            // node would stay fixed and clicks would no longer fade.
            runningRef.current?.cancel();

            const view = svg.ownerDocument.defaultView ?? window;
            const start = { x: event.clientX, y: event.clientY };
            const grabbed = invert(getTransform(), svgPoint(svg, event));
            // d3-drag subject: the position at pointer down, minus the pointer in graph coordinates.
            const offset = { x: (node.x ?? 0) - grabbed.x, y: (node.y ?? 0) - grabbed.y };
            let engine: LayoutEngine | undefined;

            /** Ends the drag; false if it never started, so the pointer down stays a click. */
            const finish = (pin: boolean): boolean => {
                runningRef.current = undefined;
                if (!engine) {
                    return false;
                }
                engine.dragEnd(node, { pin });
                onDraggingChange?.(false);
                return true;
            };

            const stop = trackPointer(view, event.pointerId, {
                move: move => {
                    if (!engine) {
                        if (move.clientX === start.x && move.clientY === start.y) {
                            return;
                        }
                        engine = getEngine();
                        if (!engine) {
                            return;
                        }
                        engine.dragStart(node);
                        onDraggingChange?.(true);
                    }
                    const pointer = invert(getTransform(), svgPoint(svg, move));
                    engine.drag(node, { x: pointer.x + offset.x, y: pointer.y + offset.y });
                },
                end: up => {
                    // Shift on release pins the node in the force layout.
                    if (finish(up.type === 'pointerup' && up.shiftKey)) {
                        suppressNextClick(view);
                    }
                },
            });
            runningRef.current = {
                stop,
                cancel: () => {
                    stop();
                    finish(false);
                },
            };
        },
        [getEngine, getTransform, onDraggingChange]
    );

    return { onPointerDown };
};
