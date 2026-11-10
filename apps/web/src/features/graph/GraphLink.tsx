import { graphSettings, linkEnd, mainRadius, type View, type VisualLink } from '@qualivis/core';
import { memo, useContext } from 'react';
import { GraphDefsContext } from './graphDefsContext';

type GraphLinkProps = {
    link: VisualLink;
    view: View;
    /** Opacity while the graph is faded (useFade); the legacy app set the attribute instead. */
    opacity?: number;
};

/** Coordinates of a link line. */
export type LineCoordinates = { x1: number; y1: number; x2: number; y2: number };

const position = (node: { x?: number; y?: number }) => ({ x: node.x ?? 0, y: node.y ?? 0 });

/**
 * Arrow from the centre of the source to the edge of the target (legacy tick,
 * graph.component.ts:657-671). Undefined when source and target are on the same spot: the legacy
 * line got NaN coordinates and did not show.
 */
export const linkCoordinates = (link: VisualLink, view: View): LineCoordinates | undefined => {
    const start = position(link.source);
    const end = linkEnd(start, position(link.target), mainRadius(link.target.width, view));
    if (Number.isNaN(end.x) || Number.isNaN(end.y)) {
        return undefined;
    }
    return { x1: start.x, y1: start.y, x2: end.x, y2: end.y };
};

/**
 * Arrow of a link (legacy createLinks, graph.component.ts:615-655); dashed when the target is
 * inherited. The line is always drawn, hidden while source and target are on the same spot, so
 * that the layout can move it without React (writePositions). Only renders again when its props
 * change; the positions come from writePositions in between.
 */
export const GraphLink = memo(({ link, view, opacity }: GraphLinkProps) => {
    const { arrowhead } = useContext(GraphDefsContext);
    const coordinates = linkCoordinates(link, view);
    const display = coordinates ? undefined : 'none';

    return (
        <line
            {...coordinates}
            strokeWidth={graphSettings.linkStrokeWidth}
            style={
                display === undefined && opacity === undefined ? undefined : { display, opacity }
            }
            strokeDasharray={link.inherits ? '4 2' : undefined}
            markerEnd={`url(#${arrowhead})`}
        />
    );
});
