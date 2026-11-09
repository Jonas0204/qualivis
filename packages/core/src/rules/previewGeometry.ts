// Geometry of the main circle and the preview circles of app view nodes (legacy
// graph.component.ts:811-857, 984-1028, 1130-1156), see
// docs/migration/01-referenz-altsystem/03-visuelle-regeln.md §5 and §6.
import type { Node } from '../model/graph';
import { graphSettings } from '../model/graphSettings';
import type { View } from './nodeVisuals';

const { previewCircleRadius, circleStrokeWidth } = graphSettings;

/** Room for the preview circles around app view nodes (legacy getCirclePreviewWidth, = 14). */
export const previewWidth = (previewCircleRadius + circleStrokeWidth / 2) * 4;

/** Radius of the main circle without its stroke; app view nodes include the preview width. */
export const mainRadius = (width: number, view: View): number => {
    let circleWidth = width;
    if (view === 'app') {
        circleWidth -= previewWidth;
    }
    return circleWidth / 2;
};

/** Radius of the ring the preview circles sit on (main radius + 0.5 + 3.5). */
export const outerRadius = (width: number, view: View): number =>
    mainRadius(width, view) + circleStrokeWidth / 2 + previewWidth / 4;

/** Angle of the preview circle with this index on a ring of this radius (legacy getCircleIndexValue). */
export const indexAngle = (index: number, radius: number): number =>
    (index / radius) * (previewCircleRadius + circleStrokeWidth / 2) * 2;

export type PreviewCircle = {
    id: string;
    cx: number;
    cy: number;
    hidden: boolean;
    className: string;
};

const fullCircle = Math.PI * 2;

const previewClassName = (fn: Node): string => {
    let className = `function ${fn.type}`;
    if (fn.returnsJSX) {
        className += ' jsx';
    }
    if (fn.special) {
        className += ' special';
    }
    return className;
};

/**
 * Preview circles of an app view node, one per function in the given order. Legacy quirk V6: the
 * radius comes from the width of the parent node (see
 * docs/migration/01-referenz-altsystem/03-visuelle-regeln.md §16). A circle is hidden when the
 * next but one would pass a full turn.
 */
export const previewCircles = (
    parentWidth: number,
    functions: readonly Node[]
): PreviewCircle[] => {
    const r = outerRadius(parentWidth, 'app');
    return functions.map((fn, i) => ({
        id: fn.id,
        cx: r * Math.cos(indexAngle(i, r) - Math.PI * 0.5),
        cy: r * Math.sin(indexAngle(i, r) - Math.PI * 0.5),
        hidden: indexAngle(i + 2, r) > fullCircle,
        className: previewClassName(fn),
    }));
};

/**
 * Position of the "..." of an app view node: at the first hidden preview circle, or undefined when
 * all circles fit.
 */
export const previewDots = (
    parentWidth: number,
    functions: readonly Node[]
): { x: number; y: number } | undefined => {
    const r = outerRadius(parentWidth, 'app');
    const index = functions.findIndex(
        (_, i) => indexAngle(i + 1, r) <= fullCircle && indexAngle(i + 2, r) > fullCircle
    );
    if (index < 0) {
        return undefined;
    }
    return {
        x: r * Math.cos(indexAngle(index, r) - Math.PI * 0.5),
        y: r * Math.sin(indexAngle(index, r) - Math.PI * 0.5),
    };
};
