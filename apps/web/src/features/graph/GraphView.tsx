import { buildViewModel, defaultSettings, graphSettings } from '@qualivis/core';
import { useAtomValue } from 'jotai';
import { useMemo, useRef } from 'react';
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

// Legacy defaults until the settings come in P07 and the size metric select in P05-S11.
const settings = defaultSettings;
const sizeOptions = {
    sizeMetric: graphSettings.defaultSizeMetric,
    nodeSizesBasedOnMetrics: settings.nodeSizesBasedOnMetrics ?? true,
};

/** Graph of the current view, laid out with the force layout and fitted into the area. */
export const GraphView = ({ createLayout = createForceLayout }: GraphViewProps) => {
    const viewGraph = useAtomValue(viewGraphAtom);
    const areaRef = useRef<HTMLDivElement>(null);
    const size = useElementSize(areaRef);

    // A new copy for every graph: the layout writes positions into its nodes and links, so they
    // must not be the value of an atom (architecture §5; the legacy app copied on every graph,
    // graph.component.ts:166-171).
    const model = useMemo(
        () =>
            viewGraph && buildViewModel(viewGraph.graph, { ...sizeOptions, view: viewGraph.view }),
        [viewGraph]
    );

    // Like the legacy app, the layout takes the area size when it starts and does not restart when
    // the area is resized; hence `size !== undefined` instead of `size` in the deps.
    useLayout(
        () =>
            model && size
                ? createLayout({ nodes: model.nodes, links: model.links, ...size })
                : undefined,
        [model, size !== undefined, createLayout]
    );

    // Nodes get their first position when the engine is created; draw them only from then on.
    const placed = model?.nodes.every(node => node.x !== undefined && node.y !== undefined);

    return (
        <div ref={areaRef} className="qv-graph-area">
            {viewGraph && model && placed && (
                <GraphCanvas
                    nodes={model.nodes}
                    links={model.links}
                    view={viewGraph.view}
                    viewBox={fitViewBox(model.nodes)}
                    settings={settings}
                />
            )}
        </div>
    );
};
