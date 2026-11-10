import { type RefObject, useEffect, useLayoutEffect, useRef } from 'react';
import {
    easeOut,
    interpolateTransform,
    transformAttribute,
    wheelTransitionDuration,
    type ZoomTransform,
} from './zoomMath';

/** What zooming changes at the zoom group: transform, label size (px) and link width. */
export type ZoomFrame = {
    transform: ZoomTransform;
    labelFontSize: number;
    linkStrokeWidth: number;
};

const sameTransform = (a: ZoomTransform, b: ZoomTransform) =>
    a.k === b.k && a.x === b.x && a.y === b.y;

const interpolateFrame = (from: ZoomFrame, to: ZoomFrame, t: number): ZoomFrame => ({
    transform: interpolateTransform(from.transform, to.transform, t),
    labelFontSize: from.labelFontSize + (to.labelFontSize - from.labelFontSize) * t,
    linkStrokeWidth: from.linkStrokeWidth + (to.linkStrokeWidth - from.linkStrokeWidth) * t,
});

/** Writes a frame as GraphCanvas renders it: transform attribute and the two CSS variables. */
const writeFrame = (group: SVGGElement, frame: ZoomFrame) => {
    group.setAttribute('transform', transformAttribute(frame.transform));
    group.style.setProperty('--qv-label-font-size', `${frame.labelFontSize}px`);
    group.style.setProperty('--qv-link-stroke-width', String(frame.linkStrokeWidth));
};

/**
 * Eases the zoom group from the frame on screen to `target` while `transition` is on, as the
 * legacy CSS transition of transform, label size and link width did (addTransition and
 * createLinks, graph.component.ts:512-520, 667). Animated here instead of with CSS: Chrome draws
 * a CSS transform transition of a large SVG group as a scaled layer, and large graphs flickered
 * while zooming (P08-S09). A new target starts from where the animation is, like a CSS
 * transition; without `transition` or without a new transform the target shows at once.
 */
export const useZoomTransition = (
    groupRef: RefObject<SVGGElement | null>,
    target: ZoomFrame,
    transition: boolean
): void => {
    const shownRef = useRef<ZoomFrame>(undefined);
    const frameRef = useRef<number>(undefined);
    const { k, x, y } = target.transform;
    const { labelFontSize, linkStrokeWidth } = target;

    // Before the paint, so that the target React has just written never shows for a frame.
    useLayoutEffect(() => {
        if (frameRef.current !== undefined) {
            cancelAnimationFrame(frameRef.current);
            frameRef.current = undefined;
        }
        const group = groupRef.current;
        const from = shownRef.current;
        const to: ZoomFrame = { transform: { k, x, y }, labelFontSize, linkStrokeWidth };
        if (!group) {
            shownRef.current = to;
            return;
        }
        // Sizes alone change on a restart, which drew new labels and links in the legacy app:
        // they took the new size at once.
        if (!transition || !from || sameTransform(from.transform, to.transform)) {
            // Written also when an animation stops halfway with the same target: React leaves
            // the attribute it wrote alone then.
            shownRef.current = to;
            writeFrame(group, to);
            return;
        }

        writeFrame(group, from);
        let start: number | undefined;
        const step = (now: number) => {
            start ??= now;
            const t = (now - start) / wheelTransitionDuration;
            const frame = t >= 1 ? to : interpolateFrame(from, to, easeOut(t));
            shownRef.current = frame;
            writeFrame(group, frame);
            frameRef.current = t >= 1 ? undefined : requestAnimationFrame(step);
        };
        frameRef.current = requestAnimationFrame(step);
    }, [groupRef, k, x, y, labelFontSize, linkStrokeWidth, transition]);

    useEffect(
        () => () => {
            if (frameRef.current !== undefined) {
                cancelAnimationFrame(frameRef.current);
            }
        },
        []
    );
};
