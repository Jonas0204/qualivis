type Point = { x: number; y: number };

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
