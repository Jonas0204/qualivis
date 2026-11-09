import { graphSettings, linkEnd, mainRadius, type View, type VisualLink } from '@qualivis/core';
import { useContext } from 'react';
import { GraphDefsContext } from './graphDefsContext';

type GraphLinkProps = {
    link: VisualLink;
    view: View;
};

const position = (node: { x?: number; y?: number }) => ({ x: node.x ?? 0, y: node.y ?? 0 });

/**
 * Arrow from the centre of the source to the edge of the target (legacy createLinks and tick,
 * graph.component.ts:615-671); dashed when the target is inherited.
 */
export const GraphLink = ({ link, view }: GraphLinkProps) => {
    const { arrowhead } = useContext(GraphDefsContext);
    const start = position(link.source);
    const end = linkEnd(start, position(link.target), mainRadius(link.target.width, view));

    // Source and target on the same spot: the legacy line got NaN coordinates and did not show.
    if (Number.isNaN(end.x) || Number.isNaN(end.y)) {
        return null;
    }

    return (
        <line
            x1={start.x}
            y1={start.y}
            x2={end.x}
            y2={end.y}
            strokeWidth={graphSettings.linkStrokeWidth}
            strokeDasharray={link.inherits ? '4 2' : undefined}
            markerEnd={`url(#${arrowhead})`}
        />
    );
};
