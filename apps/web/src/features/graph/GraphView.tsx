import { useAtomValue } from 'jotai';
import { useRef } from 'react';
import { viewGraphAtom } from '../../state/viewAtoms';
import { GraphCanvas } from './GraphCanvas';
import { fitViewBox } from './geometry';
import { createForceLayout, type ForceLayoutOptions } from './layout/forceLayout';
import type { LayoutEngine } from './layout/types';
import { useElementSize } from './useElementSize';
import { useLayout } from './useLayout';
import './graph.css';

export type LayoutFactory = (options: ForceLayoutOptions) => LayoutEngine;

type GraphViewProps = {
    /** Builds the layout engine; tests pass a fake one. */
    createLayout?: LayoutFactory;
};

/** Graph of the current view, laid out with the force layout and fitted into the area. */
export const GraphView = ({ createLayout = createForceLayout }: GraphViewProps) => {
    const graph = useAtomValue(viewGraphAtom);
    const areaRef = useRef<HTMLDivElement>(null);
    const size = useElementSize(areaRef);

    // Like the legacy app, the layout takes the area size when it starts and does not restart when
    // the area is resized; hence `size !== undefined` instead of `size` in the deps.
    useLayout(
        () =>
            graph && size
                ? createLayout({ nodes: graph.nodes, links: graph.links, ...size })
                : undefined,
        [graph, size !== undefined, createLayout]
    );

    // Nodes get their first position when the engine is created; draw them only from then on.
    const placed = graph?.nodes.every(node => node.x !== undefined && node.y !== undefined);

    return (
        <div ref={areaRef} className="qv-graph-area">
            {graph && placed && (
                <GraphCanvas
                    nodes={graph.nodes}
                    links={graph.links}
                    viewBox={fitViewBox(graph.nodes)}
                />
            )}
        </div>
    );
};
