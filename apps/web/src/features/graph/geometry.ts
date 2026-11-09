export type Point = { x: number; y: number };

/**
 * End of a link that stops `radius` before the target's centre (graph.component.ts:615-642):
 * the arrowhead then touches the circle.
 */
export const shortenToTarget = (source: Point, target: Point, radius: number): Point => {
    const diffX = target.x - source.x;
    const diffY = target.y - source.y;
    const distance = Math.sqrt(diffX ** 2 + diffY ** 2);
    const actualDistance = distance - radius;
    return {
        x: source.x + (diffX / distance) * actualDistance,
        y: source.y + (diffY / distance) * actualDistance,
    };
};

/** Margin around the outermost node centres: one node diameter. */
const viewBoxMargin = 48;

/**
 * viewBox around all placed nodes, so the SVG shows the whole graph. Stand-in for zoom-to-fit
 * until P05-S07 adds pan and zoom.
 */
export const fitViewBox = (nodes: readonly { x?: number; y?: number }[]): string => {
    const placed = nodes.filter(
        (node): node is Point => Number.isFinite(node.x) && Number.isFinite(node.y)
    );
    if (placed.length === 0) {
        return '0 0 1 1';
    }

    const xs = placed.map(node => node.x);
    const ys = placed.map(node => node.y);
    const minX = Math.min(...xs) - viewBoxMargin;
    const minY = Math.min(...ys) - viewBoxMargin;
    const width = Math.max(...xs) + viewBoxMargin - minX;
    const height = Math.max(...ys) + viewBoxMargin - minY;
    return `${minX} ${minY} ${width} ${height}`;
};
