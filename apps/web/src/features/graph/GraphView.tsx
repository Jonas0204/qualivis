import { buildViewModel, defaultSettings, graphSettings, type Settings } from '@qualivis/core';
import { useAtomValue } from 'jotai';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { viewGraphAtom } from '../../state/viewAtoms';
import { Icon } from '../../ui/Icon';
import { GraphCanvas } from './GraphCanvas';
import { createLayout as createDefaultLayout, type LayoutFactory } from './layout/createLayout';
import { useElementSize } from './useElementSize';
import { useLayout } from './useLayout';
import { useNodeDrag } from './useNodeDrag';
import { browserMeasure, type PanZoomMeasure, usePanZoom } from './usePanZoom';
import { nextZoomStyle, type ZoomStyle, type ZoomTransform, zoomLevel } from './zoomMath';
import './graph.css';

type GraphViewProps = {
    /** Builds the layout engine; tests pass a fake one. */
    createLayout?: LayoutFactory;
    /** The legacy defaults until the settings come in P07. */
    settings?: Settings;
    /** Measurements for zoom to fit; tests pass fixed ones, since jsdom has no layout. */
    measure?: PanZoomMeasure;
};

// Until the size metric select in P05-S11.
const sizeMetric = graphSettings.defaultSizeMetric;

/** Graph of the current view, laid out by the engine of the settings, with pan, zoom and drag. */
export const GraphView = ({
    createLayout = createDefaultLayout,
    settings = defaultSettings,
    measure = browserMeasure,
}: GraphViewProps) => {
    const viewGraph = useAtomValue(viewGraphAtom);
    const areaRef = useRef<HTMLDivElement>(null);
    const size = useElementSize(areaRef);
    const nodeSizesBasedOnMetrics = settings.nodeSizesBasedOnMetrics ?? true;
    const colaLayout = settings.colaLayout ?? true;
    const autoZoom = settings.autoZoom ?? true;

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

    const [zoomStyle, setZoomStyle] = useState<ZoomStyle>({});
    const handleZoom = useCallback((transform: ZoomTransform) => {
        setZoomStyle(current => nextZoomStyle(current, transform.k));
    }, []);
    const panZoom = usePanZoom({ measure, onZoom: handleZoom });

    // Like the legacy app, the layout takes the area size when it starts and does not restart when
    // the area is resized; hence `size !== undefined` instead of `size` in the deps. A new engine
    // for the same model starts from the positions of the old one, as the legacy restartGraph did.
    const layout = useLayout(
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

    // A restart draws new labels and links, which the legacy app gave the default sizes again.
    const [styleRun, setStyleRun] = useState(layout.run);
    if (styleRun !== layout.run) {
        setStyleRun(layout.run);
        setZoomStyle({});
    }

    // G17: fit the graph in after the first end of every layout run (legacy firstSimulation); later
    // ends, e.g. after dragging, leave the zoom alone.
    const { zoomToFit } = panZoom;
    const fittedRun = useRef<number>(undefined);
    useEffect(() => {
        if (layout.ended && fittedRun.current !== layout.run) {
            fittedRun.current = layout.run;
            if (autoZoom) {
                zoomToFit();
            }
        }
    }, [layout.run, layout.ended, autoZoom, zoomToFit]);

    const drag = useNodeDrag({
        getEngine: layout.getEngine,
        getTransform: panZoom.getTransform,
    });

    // Nodes get their first position when the engine starts; draw them only from then on.
    const placed = model?.nodes.every(node => node.x !== undefined && node.y !== undefined);

    return (
        <div ref={areaRef} className="qv-graph-area">
            {viewGraph && model && (
                <GraphCanvas
                    nodes={placed ? model.nodes : []}
                    links={placed ? model.links : []}
                    view={viewGraph.view}
                    settings={settings}
                    zoom={{
                        ...zoomStyle,
                        transform: panZoom.transform,
                        transition: panZoom.transition,
                    }}
                    svgRef={panZoom.svgRef}
                    zoomGroupRef={panZoom.zoomGroupRef}
                    onPointerDown={panZoom.onPointerDown}
                    onNodePointerDown={drag.onPointerDown}
                />
            )}
            {viewGraph && (
                // Until the action bar with tooltips in P05-S11 (graph.component.html:199-209).
                <div className="qv-graph-zoom">
                    <button type="button" aria-label="Zoom to 100%" onClick={panZoom.zoomTo100}>
                        {zoomLevel(panZoom.transform.k)}%
                    </button>
                    <button type="button" aria-label="Zoom to fit" onClick={panZoom.zoomToFit}>
                        <Icon name="all_out" />
                    </button>
                </div>
            )}
        </div>
    );
};
