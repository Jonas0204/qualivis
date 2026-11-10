// Zoom and pan as in d3-zoom 1.x, which the legacy app used (d3 5): graph point · k + (x, y) =
// screen point. Rules: docs/migration/01-referenz-altsystem/03-visuelle-regeln.md §10.
import { graphSettings } from '@qualivis/core';

export type ZoomTransform = { k: number; x: number; y: number };
export type Point = { x: number; y: number };
export type Bounds = { x: number; y: number; width: number; height: number };
export type Viewport = { width: number; height: number };

export const identityTransform: ZoomTransform = { k: 1, x: 0, y: 0 };

/** Largest scale of zoom to fit ("max auto zoom" in the legacy zoomToFit). */
const maxFitScale = 3;

/**
 * Transform that centres the bounds in the viewport (legacy zoomToFit, graph.component.ts:1058-1089):
 * the graph fills `padding` of the viewport, scaled at most 3 times, or exactly `forceScale`.
 * Nothing to fit without width or height.
 */
export const fitTransform = (
    bounds: Bounds,
    viewport: Viewport,
    padding = 0.95,
    forceScale?: number
): ZoomTransform | undefined => {
    const { width, height } = bounds;
    if (width === 0 || height === 0) {
        return undefined;
    }

    const midX = bounds.x + width / 2;
    const midY = bounds.y + height / 2;
    const k =
        forceScale ||
        Math.min(padding / Math.max(width / viewport.width, height / viewport.height), maxFitScale);
    return { k, x: viewport.width / 2 - k * midX, y: viewport.height / 2 - k * midY };
};

/** Graph point at a screen point (d3 transform.invert). */
export const invert = ({ k, x, y }: ZoomTransform, point: Point): Point => ({
    x: (point.x - x) / k,
    y: (point.y - y) / k,
});

/** Moves the transform so that the graph point lies under the screen point (pan). */
export const translateTo = ({ k }: ZoomTransform, screen: Point, graph: Point): ZoomTransform => ({
    k,
    x: screen.x - graph.x * k,
    y: screen.y - graph.y * k,
});

/** Scales by `factor` around the pointer: the graph point under it stays in place (d3 wheeled). */
export const zoomAt = (transform: ZoomTransform, pointer: Point, factor: number): ZoomTransform =>
    translateTo({ ...transform, k: transform.k * factor }, pointer, invert(transform, pointer));

/** A pointer held on the graph: where it is now and which graph point it grabbed. */
export type Grip = { screen: Point; graph: Point };

const midpoint = (a: Point, b: Point): Point => ({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 });

const squaredDistance = (a: Point, b: Point): number => (b.x - a.x) ** 2 + (b.y - a.y) ** 2;

/**
 * Transform while pointers hold the graph (d3-zoom 1.x touchmoved): one pointer pans, two fingers
 * scale by their distance on screen against their distance in the graph and keep the grabbed
 * midpoint under their midpoint. If either distance is 0 the scale stays (d3-zoom would reach 0
 * or infinity).
 */
export const gripTransform = (
    current: ZoomTransform,
    first: Grip,
    second?: Grip
): ZoomTransform => {
    if (!second) {
        return translateTo(current, first.screen, first.graph);
    }
    const onScreen = squaredDistance(first.screen, second.screen);
    const inGraph = squaredDistance(first.graph, second.graph);
    const k = onScreen > 0 && inGraph > 0 ? Math.sqrt(onScreen / inGraph) : current.k;
    return translateTo(
        { ...current, k },
        midpoint(first.screen, second.screen),
        midpoint(first.graph, second.graph)
    );
};

/**
 * Scale factor of one wheel event (default wheelDelta of d3-zoom), per pixel, line or page.
 * No limits: the default scale extent of d3-zoom is [0, ∞). Browsers send a pinch on the touchpad
 * as Ctrl+wheel with small deltas; as in d3-zoom 3 they count ten times (a Ctrl+wheel notch of a
 * mouse zooms by 4 instead of about 1.15).
 */
export const wheelFactor = (deltaY: number, deltaMode: number, ctrlKey = false): number =>
    2 ** (-deltaY * (deltaMode === 1 ? 0.05 : deltaMode ? 1 : 0.002) * (ctrlKey ? 10 : 1));

/** Zoom level of the "{n}%" button. */
export const zoomLevel = (k: number): number => Math.round(k * 100);

/** Label size in px once labels would grow beyond 20 px on screen; undefined = leave it. */
export const labelFontSize = (k: number): number | undefined =>
    graphSettings.normalTextSize * k > graphSettings.maxTextSize
        ? graphSettings.maxTextSize / k
        : undefined;

/** Link width once links would grow beyond 1.6 on screen; undefined = leave it. */
export const linkStrokeWidth = (k: number): number | undefined =>
    graphSettings.linkStrokeWidth * k > graphSettings.maxLinkStrokeWidth
        ? graphSettings.maxLinkStrokeWidth / k
        : undefined;

/** Label size and link width set by zooming; undefined keeps the defaults (14 px, 0.8). */
export type ZoomStyle = { labelFontSize?: number; linkStrokeWidth?: number };

/**
 * Style after a zoom to scale k. Legacy quirk V5: zooming out again does not reset it; the
 * smaller size stays until the graph restarts (see docs/migration/01-referenz-altsystem/03-visuelle-regeln.md §10).
 */
export const nextZoomStyle = (current: ZoomStyle, k: number): ZoomStyle => {
    const fontSize = labelFontSize(k);
    const strokeWidth = linkStrokeWidth(k);
    if (fontSize === undefined && strokeWidth === undefined) {
        return current;
    }
    return {
        labelFontSize: fontSize ?? current.labelFontSize,
        linkStrokeWidth: strokeWidth ?? current.linkStrokeWidth,
    };
};

/** `transform` attribute of the zoom group, written like d3 ZoomTransform.toString. */
export const transformAttribute = ({ k, x, y }: ZoomTransform): string =>
    `translate(${x},${y}) scale(${k})`;

/** d3.easeCubicInOut, the default easing of d3 transitions. */
export const easeCubicInOut = (t: number): number => {
    const doubled = t * 2;
    return (doubled <= 1 ? doubled ** 3 : (doubled - 2) ** 3 + 2) / 2;
};

/** Linear in k, x and y: enough for zoom to fit (d3 interpolateZoom swings out in between). */
export const interpolateTransform = (
    from: ZoomTransform,
    to: ZoomTransform,
    t: number
): ZoomTransform => ({
    k: from.k + (to.k - from.k) * t,
    x: from.x + (to.x - from.x) * t,
    y: from.y + (to.y - from.y) * t,
});

/** Duration of the wheel transition (graphSettings.zoomTransition, "0.1s ease-out"). */
export const wheelTransitionDuration = 100;

/**
 * CSS `ease-out`, cubic-bezier(0, 0, 0.58, 1), of the legacy wheel transition: the curve point
 * whose x is `t`, found by bisection (x grows with the curve parameter).
 */
export const easeOut = (t: number): number => {
    if (t <= 0 || t >= 1) {
        return t <= 0 ? 0 : 1;
    }
    const x = (u: number) => 3 * (1 - u) * u * u * 0.58 + u ** 3;
    let low = 0;
    let high = 1;
    for (let i = 0; i < 30; i++) {
        const mid = (low + high) / 2;
        if (x(mid) < t) {
            low = mid;
        } else {
            high = mid;
        }
    }
    const u = (low + high) / 2;
    return 3 * (1 - u) * u * u + u ** 3;
};
