import {
    type PointerEvent as ReactPointerEvent,
    type RefCallback,
    type RefObject,
    useCallback,
    useEffect,
    useRef,
    useState,
} from 'react';
import { suppressNextClick, svgPoint, trackPointer } from './pointerGesture';
import {
    type Bounds,
    easeCubicInOut,
    fitTransform,
    type Grip,
    gripTransform,
    identityTransform,
    interpolateTransform,
    invert,
    type Viewport,
    wheelFactor,
    type ZoomTransform,
    zoomAt,
} from './zoomMath';

/** Measurements for zoom to fit; jsdom has no layout, so tests pass fixed values. */
export type PanZoomMeasure = {
    /** Bounding box of the drawn graph in graph coordinates. */
    bounds: (zoomGroup: SVGGElement) => Bounds;
    viewport: (svg: SVGSVGElement) => Viewport;
};

export const browserMeasure: PanZoomMeasure = {
    bounds: zoomGroup => zoomGroup.getBBox(),
    viewport: svg => ({ width: svg.clientWidth, height: svg.clientHeight }),
};

export type PanZoomOptions = {
    measure?: PanZoomMeasure;
    /** Called with every new transform, like the legacy zoom event. */
    onZoom?: (transform: ZoomTransform) => void;
};

export type PanZoom = {
    /** Ref of the SVG: it gets the wheel listener. */
    svgRef: RefCallback<SVGSVGElement>;
    zoomGroupRef: RefObject<SVGGElement | null>;
    transform: ZoomTransform;
    /** On after wheel zooming, off on pointer down and zoom to fit (legacy addTransition). */
    transition: boolean;
    /** The current transform, also between renders (for dragging). */
    getTransform: () => ZoomTransform;
    zoomToFit: () => void;
    /** Zoom to 100 %, centred on the graph (legacy zoomToFit(null, 1)). */
    zoomTo100: () => void;
    /**
     * Pointer down on the SVG starts a pan, a second finger turns it into a pinch zoom; node groups
     * stop the event (dragging).
     */
    onPointerDown: (event: ReactPointerEvent<SVGSVGElement>) => void;
};

/** A pointer that holds the graph (d3-zoom touch0 and touch1) and how to stop following it. */
type HeldGrip = Grip & { pointerId: number; stop: () => void };

/** Duration of zoom to fit: the default duration of d3 transitions. */
const fitDuration = 250;

/**
 * Pan and zoom like d3-zoom 1.x with the legacy setup (createSVG, graph.component.ts:472-528):
 * wheel zooms around the pointer, dragging the background pans, two fingers zoom on touch screens,
 * no double click or double tap zoom. As in
 * d3-zoom, a pointer down with Ctrl or with another button than the left one does nothing.
 * Deviation: Ctrl+wheel (a pinch on the touchpad) zooms the graph like in d3-zoom 3; d3-zoom 1.x
 * left it to the browser, which zoomed the whole page (ADR-011 A12).
 */
export const usePanZoom = ({ measure = browserMeasure, onZoom }: PanZoomOptions = {}): PanZoom => {
    const [transform, setTransform] = useState(identityTransform);
    const [transition, setTransition] = useState(false);
    const transformRef = useRef(identityTransform);
    const svgElementRef = useRef<SVGSVGElement>(null);
    const zoomGroupRef = useRef<SVGGElement>(null);
    const frameRef = useRef<number>(undefined);
    // At most two, like touch0 and touch1 in d3-zoom; a mouse holds with one.
    const gripsRef = useRef<HeldGrip[]>([]);
    const movedRef = useRef(false);
    const onZoomRef = useRef(onZoom);

    useEffect(() => {
        onZoomRef.current = onZoom;
    }, [onZoom]);

    const apply = useCallback((next: ZoomTransform) => {
        transformRef.current = next;
        setTransform(next);
        onZoomRef.current?.(next);
    }, []);

    // d3-zoom interrupts a running zoom to fit on wheel and mouse down.
    const stopAnimation = useCallback(() => {
        if (frameRef.current !== undefined) {
            cancelAnimationFrame(frameRef.current);
            frameRef.current = undefined;
        }
    }, []);

    useEffect(
        () => () => {
            stopAnimation();
            for (const grip of gripsRef.current) {
                grip.stop();
            }
            gripsRef.current = [];
        },
        [stopAnimation]
    );

    // A native listener: React registers onWheel as passive, so preventDefault would not work.
    const svgRef = useCallback<RefCallback<SVGSVGElement>>(
        svg => {
            svgElementRef.current = svg;
            if (!svg) {
                return;
            }

            const onWheel = (event: WheelEvent) => {
                const current = transformRef.current;
                const factor = wheelFactor(event.deltaY, event.deltaMode, event.ctrlKey);
                const next = zoomAt(current, svgPoint(svg, event), factor);
                // Like d3-zoom: a wheel event that does not change the scale stays with the browser.
                if (next.k === current.k) {
                    return;
                }
                event.preventDefault();
                stopAnimation();
                setTransition(true);
                apply(next);
            };

            svg.addEventListener('wheel', onWheel, { passive: false });
            return () => {
                svg.removeEventListener('wheel', onWheel);
                svgElementRef.current = null;
            };
        },
        [apply, stopAnimation]
    );

    const onPointerDown = useCallback(
        (event: ReactPointerEvent<SVGSVGElement>) => {
            // Legacy: every mouse down on the graph switches the wheel transition off.
            setTransition(false);
            if (event.ctrlKey || event.button !== 0) {
                return;
            }

            const held = gripsRef.current.filter(grip => grip.pointerId !== event.pointerId);
            // Like d3-zoom: a third finger does nothing.
            if (held.length === 2) {
                return;
            }
            // A grip of the same pointer missed its pointer up; it starts again.
            for (const grip of gripsRef.current) {
                if (grip.pointerId === event.pointerId) {
                    grip.stop();
                }
            }
            if (held.length === 0) {
                movedRef.current = false;
            }

            const svg = event.currentTarget;
            const view = svg.ownerDocument.defaultView ?? window;
            const start = { x: event.clientX, y: event.clientY };
            const screen = svgPoint(svg, event);
            const grip: HeldGrip = {
                pointerId: event.pointerId,
                screen,
                graph: invert(transformRef.current, screen),
                stop: () => undefined,
            };

            stopAnimation();
            grip.stop = trackPointer(view, event.pointerId, {
                move: move => {
                    movedRef.current ||= move.clientX !== start.x || move.clientY !== start.y;
                    grip.screen = svgPoint(svg, move);
                    const [first, second] = gripsRef.current;
                    if (first) {
                        apply(gripTransform(transformRef.current, first, second));
                    }
                },
                end: () => {
                    gripsRef.current = gripsRef.current.filter(other => other !== grip);
                    const [rest] = gripsRef.current;
                    if (rest) {
                        // d3-zoom: the finger left pans on from the graph point under it now.
                        rest.graph = invert(transformRef.current, rest.screen);
                    } else if (movedRef.current) {
                        suppressNextClick(view);
                    }
                },
            });
            gripsRef.current = [...held, grip];
        },
        [apply, stopAnimation]
    );

    const animateTo = useCallback(
        (target: ZoomTransform) => {
            stopAnimation();
            const from = transformRef.current;
            let startTime: number | undefined;
            const step = (now: number) => {
                startTime ??= now;
                const t = (now - startTime) / fitDuration;
                if (t >= 1) {
                    frameRef.current = undefined;
                    apply(target);
                    return;
                }
                apply(interpolateTransform(from, target, easeCubicInOut(t)));
                frameRef.current = requestAnimationFrame(step);
            };
            frameRef.current = requestAnimationFrame(step);
        },
        [apply, stopAnimation]
    );

    const fit = useCallback(
        (forceScale?: number) => {
            const svg = svgElementRef.current;
            const zoomGroup = zoomGroupRef.current;
            if (!svg || !zoomGroup) {
                return;
            }
            const target = fitTransform(
                measure.bounds(zoomGroup),
                measure.viewport(svg),
                undefined,
                forceScale
            );
            if (!target) {
                return;
            }
            setTransition(false);
            animateTo(target);
        },
        [measure, animateTo]
    );

    const zoomToFit = useCallback(() => fit(), [fit]);
    const zoomTo100 = useCallback(() => fit(1), [fit]);
    const getTransform = useCallback(() => transformRef.current, []);

    return {
        svgRef,
        zoomGroupRef,
        transform,
        transition,
        getTransform,
        zoomToFit,
        zoomTo100,
        onPointerDown,
    };
};
