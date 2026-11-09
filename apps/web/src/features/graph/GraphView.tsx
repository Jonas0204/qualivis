import { buildViewModel, defaultSettings, graphSettings, type Settings } from '@qualivis/core';
import { useAtomValue } from 'jotai';
import { useMemo, useRef } from 'react';
import { viewGraphAtom } from '../../state/viewAtoms';
import { GraphCanvas } from './GraphCanvas';
import { fitViewBox } from './geometry';
import { createLayout as createDefaultLayout, type LayoutFactory } from './layout/createLayout';
import { useElementSize } from './useElementSize';
import { useLayout } from './useLayout';
import './graph.css';

type GraphViewProps = {
    /** Builds the layout engine; tests pass a fake one. */
    createLayout?: LayoutFactory;
    /** The legacy defaults until the settings come in P07. */
    settings?: Settings;
};

// Until the size metric select in P05-S11.
const sizeMetric = graphSettings.defaultSizeMetric;

/** Graph of the current view, laid out by the engine of the settings and fitted into the area. */
export const GraphView = ({
    createLayout = createDefaultLayout,
    settings = defaultSettings,
}: GraphViewProps) => {
    const viewGraph = useAtomValue(viewGraphAtom);
    const areaRef = useRef<HTMLDivElement>(null);
    const size = useElementSize(areaRef);
    const nodeSizesBasedOnMetrics = settings.nodeSizesBasedOnMetrics ?? true;
    const colaLayout = settings.colaLayout ?? true;

    // A new copy for every graph: the layout writes positions into its nodes and links, so they
    // must not be the value of an atom (architecture §5; the legacy app copied on every graph,
    // graph.component.ts:166-171).
    const model = useMemo(
        () =>
            viewGraph &&
            buildViewModel(viewGraph.graph, {
                view: viewGraph.view,
                sizeMetric,
                nodeSizesBasedOnMetrics,
            }),
        [viewGraph, nodeSizesBasedOnMetrics]
    );

    // Like the legacy app, the layout takes the area size when it starts and does not restart when
    // the area is resized; hence `size !== undefined` instead of `size` in the deps. A new engine
    // for the same model starts from the positions of the old one, as the legacy restartGraph did.
    useLayout(
        () =>
            model && size
                ? createLayout(colaLayout, {
                      nodes: model.nodes,
                      links: model.links,
                      constraints: model.constraints,
                      ...size,
                  })
                : undefined,
        [model, size !== undefined, colaLayout, createLayout]
    );

    // Nodes get their first position when the engine starts; draw them only from then on.
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
