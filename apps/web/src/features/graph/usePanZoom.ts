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
    identityTransform,
    interpolateTransform,
    invert,
    translateTo,
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
    /** Pointer down on the SVG starts a pan; node groups stop the event (dragging). */
    onPointerDown: (event: ReactPointerEvent<SVGSVGElement>) => void;
};

/** Duration of zoom to fit: the default duration of d3 transitions. */
const fitDuration = 250;

/**
 * Pan and zoom like d3-zoom 1.x with the legacy setup (createSVG, graph.component.ts:472-528):
 * wheel zooms around the pointer, dragging the background pans, no double click zoom. As in
 * d3-zoom, nothing happens with Ctrl or with another button than the left one.
 */
export const usePanZoom = ({ measure = browserMeasure, onZoom }: PanZoomOptions = {}): PanZoom => {
    const [transform, setTransform] = useState(identityTransform);
    const [transition, setTransition] = useState(false);
    const transformRef = useRef(identityTransform);
    const svgElementRef = useRef<SVGSVGElement>(null);
    const zoomGroupRef = useRef<SVGGElement>(null);
    const frameRef = useRef<number>(undefined);
    const stopPanRef = useRef<() => void>(undefined);
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
            stopPanRef.current?.();
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
                if (event.ctrlKey) {
                    return;
                }
                const current = transformRef.current;
                const factor = wheelFactor(event.deltaY, event.deltaMode);
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

            const svg = event.currentTarget;
            const view = svg.ownerDocument.defaultView ?? window;
            const start = { x: event.clientX, y: event.clientY };
            const grabbed = invert(transformRef.current, svgPoint(svg, event));
            let moved = false;

            stopAnimation();
            stopPanRef.current?.();
            stopPanRef.current = trackPointer(view, event.pointerId, {
                move: move => {
                    moved ||= move.clientX !== start.x || move.clientY !== start.y;
                    apply(translateTo(transformRef.current, svgPoint(svg, move), grabbed));
                },
                end: () => {
                    stopPanRef.current = undefined;
                    if (moved) {
                        suppressNextClick(view);
                    }
                },
            });
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
