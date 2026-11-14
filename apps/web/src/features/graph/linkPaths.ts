import type { View, VisualLink } from '@qualivis/core';
import { linkCoordinates } from './GraphLink';
import type { Bounds } from './zoomMath';

/**
 * The arrow marker of a link (GraphDefs): a triangle from (0, -5) and (0, 5) to (10, 0) in a
 * 10 × 10 view box, drawn 8 stroke widths large, with the point (9, 0) on the end of the line.
 */
export const arrowMarker = { viewBoxSize: 10, refX: 9, size: 8 };

/** The links of one bundle: drawn as one path of lines (two if some are dashed) and one of arrows. */
export type LinkBundle = { solid: VisualLink[]; dashed: VisualLink[] };

/** `kept` shows at full opacity, `rest` fades while the graph is faded to a node (useFade). */
export type LinkBundles = { kept: LinkBundle; rest: LinkBundle };

/**
 * Sorts the links into the bundles. Without `opaque` all are kept; with it, the links that stay
 * visible while the graph is faded.
 */
export const bundleLinks = (
    links: readonly VisualLink[],
    opaque?: ReadonlySet<VisualLink>
): LinkBundles => {
    const bundles: LinkBundles = {
        kept: { solid: [], dashed: [] },
        rest: { solid: [], dashed: [] },
    };
    for (const link of links) {
        const bundle = !opaque || opaque.has(link) ? bundles.kept : bundles.rest;
        (link.inherits ? bundle.dashed : bundle.solid).push(link);
    }
    return bundles;
};

/** Two decimals are far below a pixel at any zoom and keep the path short. */
const round = (value: number) => Math.round(value * 100) / 100;

const outside = (x1: number, y1: number, x2: number, y2: number, area: Bounds) =>
    Math.max(x1, x2) < area.x ||
    Math.min(x1, x2) > area.x + area.width ||
    Math.max(y1, y2) < area.y ||
    Math.min(y1, y2) > area.y + area.height;

export type LinkPathData = {
    /** Path of all lines, each as GraphLink draws it (linkCoordinates). */
    lines: string;
    /** Path of all arrow heads, each as the marker of a line with this stroke width. */
    heads: string;
};

/**
 * The paths of the links at the current node positions. A link whose ends are on the same spot is
 * left out, as GraphLink hides it; with `area`, also every link that lies outside of it.
 */
export const linkPathData = (
    links: readonly VisualLink[],
    view: View,
    strokeWidth: number,
    area?: Bounds
): LinkPathData => {
    const unit = (arrowMarker.size * strokeWidth) / arrowMarker.viewBoxSize;
    const tip = (arrowMarker.viewBoxSize - arrowMarker.refX) * unit;
    const back = arrowMarker.refX * unit;
    const half = (arrowMarker.viewBoxSize / 2) * unit;
    let lines = '';
    let heads = '';
    for (const { source, target } of links) {
        // The line lies between the centres of its nodes, so they tell whether it is outside.
        if (area && outside(source.x ?? 0, source.y ?? 0, target.x ?? 0, target.y ?? 0, area)) {
            continue;
        }
        const line = linkCoordinates({ source, target }, view);
        if (!line) {
            continue;
        }
        const { x1, y1, x2, y2 } = line;
        lines += `M${round(x1)},${round(y1)}L${round(x2)},${round(y2)}`;
        const length = Math.hypot(x2 - x1, y2 - y1);
        if (length === 0) {
            continue;
        }
        const dx = (x2 - x1) / length;
        const dy = (y2 - y1) / length;
        const baseX = x2 - dx * back;
        const baseY = y2 - dy * back;
        heads +=
            `M${round(baseX - dy * half)},${round(baseY + dx * half)}` +
            `L${round(x2 + dx * tip)},${round(y2 + dy * tip)}` +
            `L${round(baseX + dy * half)},${round(baseY - dx * half)}Z`;
    }
    return { lines, heads };
};

/** Writes the paths of a drawn bundle of links again; with `area`, only the links inside it. */
export type LinkWriter = { links: readonly VisualLink[]; write: (area?: Bounds) => void };

/**
 * The writers of the drawn link layers (GraphLinkBundles) by their `g.links` element, so that
 * writePositions can move bundled links without React.
 */
export const linkWriters = new WeakMap<Element, LinkWriter>();
