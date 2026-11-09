import { type PointerEvent as ReactPointerEvent, useCallback, useEffect, useRef } from 'react';
import type { LayoutEngine, LayoutNode } from './layout/types';
import { suppressNextClick, svgPoint, trackPointer } from './pointerGesture';
import { invert, type ZoomTransform } from './zoomMath';

export type NodeDragOptions = {
    /** The running layout engine; dragging does nothing without one. */
    getEngine: () => LayoutEngine | undefined;
    getTransform: () => ZoomTransform;
    /** Reports when a drag starts and ends; no fading while dragging (P05-S09). */
    onDraggingChange?: (dragging: boolean) => void;
};

export type NodeDrag = {
    onPointerDown: (node: LayoutNode, event: ReactPointerEvent<SVGGElement>) => void;
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
    const stopRef = useRef<() => void>(undefined);

    useEffect(() => () => stopRef.current?.(), []);

    const onPointerDown = useCallback(
        (node: LayoutNode, event: ReactPointerEvent<SVGGElement>) => {
            // d3-drag default filter: left button only, without Ctrl (Ctrl+click removes, P05-S09).
            const svg = event.currentTarget.ownerSVGElement;
            if (event.ctrlKey || event.button !== 0 || !svg) {
                return;
            }
            // No pan: d3-drag stops the mouse down at the node.
            event.stopPropagation();

            const view = svg.ownerDocument.defaultView ?? window;
            const start = { x: event.clientX, y: event.clientY };
            const grabbed = invert(getTransform(), svgPoint(svg, event));
            // d3-drag subject: the position at pointer down, minus the pointer in graph coordinates.
            const offset = { x: (node.x ?? 0) - grabbed.x, y: (node.y ?? 0) - grabbed.y };
            let engine: LayoutEngine | undefined;

            stopRef.current?.();
            stopRef.current = trackPointer(view, event.pointerId, {
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
                    stopRef.current = undefined;
                    if (!engine) {
                        return;
                    }
                    // Shift on release pins the node in the force layout.
                    engine.dragEnd(node, { pin: up.type === 'pointerup' && up.shiftKey });
                    onDraggingChange?.(false);
                    suppressNextClick(view);
                },
            });
        },
        [getEngine, getTransform, onDraggingChange]
    );

    return { onPointerDown };
};
