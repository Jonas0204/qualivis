import { graphSettings } from '@qualivis/core';
import { useContext } from 'react';
import { GraphDefsContext } from './graphDefsContext';
import { arrowMarker } from './linkPaths';

/** Line of the hatch pattern: twice the circle stroke (legacy createSVG, graph.component.ts:504-506). */
const hatchStrokeWidth = Math.max(graphSettings.circleStrokeWidth * 2, 1);

/**
 * Arrow marker of the links and hatch pattern of class components (legacy graph.component.html:7-26,
 * docs/migration/01-referenz-altsystem/03-visuelle-regeln.md §8). The ids come from GraphDefsContext.
 */
export const GraphDefs = () => {
    const ids = useContext(GraphDefsContext);
    return (
        <defs>
            <marker
                id={ids.arrowhead}
                viewBox="-0 -5 10 10"
                refX={arrowMarker.refX}
                refY={0}
                orient="auto"
                markerWidth={arrowMarker.size}
                markerHeight={arrowMarker.size}
            >
                <path d="M 0,-5 L 10 ,0 L 0,5" fill={graphSettings.linkColor} stroke="none" />
            </marker>
            <pattern
                id={ids.hatch}
                className="diagonal-hatch"
                width={5}
                height={5}
                patternTransform="rotate(45 0 0)"
                patternUnits="userSpaceOnUse"
            >
                <line x1={0} y1={0} x2={0} y2={5} strokeWidth={hatchStrokeWidth} opacity={0.6} />
            </pattern>
        </defs>
    );
};
