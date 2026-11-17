import { graphSettings } from '@qualivis/core';
import { useContext } from 'react';
import { GraphDefsContext } from '../canvas/graphDefsContext';

/** A link of the graph as symbol (line with arrowhead) for a 26 × 26 viewBox centred on 0. */
export const LinkIcon = ({ dashArray }: { dashArray?: string }) => {
    const { arrowhead } = useContext(GraphDefsContext);

    return (
        <line
            x1={-12}
            x2={12}
            stroke={graphSettings.linkColor}
            strokeWidth={graphSettings.linkStrokeWidth}
            strokeOpacity={graphSettings.linkOpacity}
            strokeDasharray={dashArray}
            markerEnd={`url(#${arrowhead})`}
        />
    );
};
