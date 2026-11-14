import { createContext } from 'react';

/** Element ids of the arrow marker and the hatch pattern in the graph SVG. */
export type GraphDefIds = { arrowhead: string; hatch: string };

/**
 * Ids of the defs that GraphDefs draws. The graph puts unique ids per instance here, and everything
 * in the same document (nodes, links, later the legend) references them, as in the legacy app. The
 * default is the legacy ids, for a node or link drawn on its own.
 */
export const GraphDefsContext = createContext<GraphDefIds>({
    arrowhead: 'arrowhead',
    hatch: 'diagonalHatch',
});
