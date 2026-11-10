import { graphSettings } from '../model/graphSettings';

export type Point = { x: number; y: number };

/**
 * End of a link: it stops at the outer edge of the target's stroke (main radius + 0.5), so the
 * arrowhead touches the circle (legacy graph.component.ts:615-642, visual rules §8). When source
 * and target are at the same place, the legacy division by zero gives NaN; the graph does not
 * draw such a link.
 */
export const linkEnd = (source: Point, target: Point, targetMainRadius: number): Point => {
    const diffX = target.x - source.x;
    const diffY = target.y - source.y;
    const distance = Math.sqrt(diffX ** 2 + diffY ** 2);
    const targetRadius = targetMainRadius + graphSettings.circleStrokeWidth / 2;
    const actualDistance = distance - targetRadius;
    return {
        x: source.x + (diffX / distance) * actualDistance,
        y: source.y + (diffY / distance) * actualDistance,
    };
};
