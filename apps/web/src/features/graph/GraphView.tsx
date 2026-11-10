import {
    buildViewModel,
    defaultSettings,
    graphSettings,
    qualityMetrics,
    type Settings,
    type View,
    type VisualLink,
    type VisualNode,
    withoutNodes,
} from '@qualivis/core';
import { useAtom, useAtomValue, useSetAtom } from 'jotai';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { countEvent } from '../../lib/perfStats';
import { useStableHandlers } from '../../lib/useStableHandlers';
import { analysisAtom } from '../../state/analysisAtoms';
import {
    deselectAtom,
    selectFileAtom,
    selectionAtom,
    selectNodeAtom,
} from '../../state/selectionAtoms';
import { componentIdAtom, fullScreenAtom, viewGraphAtom } from '../../state/viewAtoms';
import { GraphActions } from './GraphActions';
import { GraphCanvas, type GraphEvents } from './GraphCanvas';
import type { NodeEvents } from './GraphNode';
import { Legend } from './Legend';
import { createLayout as createDefaultLayout, type LayoutFactory } from './layout/createLayout';
import type { LayoutNode } from './layout/types';
import {
    isRestoredAtRest,
    layoutRestore,
    placeLike,
    restoredZoomStyle,
    restoreView,
    useRestoreZoom,
    useSavedViews,
    useSaveView,
} from './savedViews';
import type { ViewGraph } from './selectViewGraph';
import { useElementSize } from './useElementSize';
import { useFade } from './useFade';
import { type LabelMeasure, useLabelCollision } from './useLabelCollision';
import { useLayout } from './useLayout';
import { useNodeDrag } from './useNodeDrag';
import { browserMeasure, type PanZoomMeasure, usePanZoom } from './usePanZoom';
import { writePositions } from './writePositions';
import { nextZoomStyle, type ZoomStyle, type ZoomTransform, zoomLevel } from './zoomMath';
import './graph.css';

export type GraphViewProps = {
    /** Builds the layout engine; tests pass a fake one. */
    createLayout?: LayoutFactory;
    /** The legacy defaults until the settings come in P07. */
    settings?: Settings;
    /** Measurements for zoom to fit; tests pass fixed ones, since jsdom has no layout. */
    measure?: PanZoomMeasure;
    /** Measures a label for hiding overlapping labels; tests pass fixed values, as for `measure`. */
    measureLabel?: LabelMeasure;
};

const noNodeIds: readonly string[] = [];
const noNodes: readonly VisualNode[] = [];
const noLinks: readonly VisualLink[] = [];

/** Nodes removed with Ctrl+click (G5), for the graph they were removed from. */
type Removal = { viewGraph: ViewGraph; nodeIds: readonly string[] };

/**
 * G14: the size metric of the select; as in the legacy app it stays when the view changes. N11
 * (legacy graph.component.ts:124-134): the component view offers no component-only metric, so it
 * goes back to "Lines of Code" there.
 */
const useSizeMetric = (view: View | undefined) => {
    const [sizeMetric, setSizeMetric] = useState(graphSettings.defaultSizeMetric);
    if (view === 'component' && qualityMetrics[sizeMetric]?.componentOnly) {
        setSizeMetric('sloc.physical');
    }
    return [sizeMetric, setSizeMetric] as const;
};

/**
 * Graph of the current view, laid out by the engine of the settings, with pan, zoom, drag,
 * selection, fading, hiding of overlapping labels, the legend and the action bars.
 */
export const GraphView = ({
    createLayout = createDefaultLayout,
    settings = defaultSettings,
    measure = browserMeasure,
    measureLabel,
}: GraphViewProps) => {
    countEvent('render.GraphView');
    const analysis = useAtomValue(analysisAtom);
    const viewGraph = useAtomValue(viewGraphAtom);
    const [componentId, setComponentId] = useAtom(componentIdAtom);
    const [fullScreen, setFullScreen] = useAtom(fullScreenAtom);
    const selection = useAtomValue(selectionAtom);
    const selectNode = useSetAtom(selectNodeAtom);
    const deselect = useSetAtom(deselectAtom);
    const selectFile = useSetAtom(selectFileAtom);
    const areaRef = useRef<HTMLDivElement>(null);
    const size = useElementSize(areaRef);
    const nodeSizesBasedOnMetrics = settings.nodeSizesBasedOnMetrics ?? true;
    const flowLayout = settings.colaLayout ?? true;
    const autoZoom = settings.autoZoom ?? true;
    const hideOverlappingLabels = settings.hideOverlappingLabels ?? true;

    const [sizeMetric, setSizeMetric] = useSizeMetric(viewGraph?.view);
    // G15: cluster colours; the legacy app kept them on when the view changed.
    const [showCluster, setShowCluster] = useState(false);

    // G5: Ctrl+click removes a node from this graph only (legacy removeNode,
    // graph.component.ts:1050-1056), not from the analysis. Restarts keep the removal as in the
    // legacy app; another graph (other view, new analysis) shows all nodes again.
    const [removal, setRemoval] = useState<Removal>();
    const removedIds = removal && removal.viewGraph === viewGraph ? removal.nodeIds : noNodeIds;
    // The legacy restart (after a removal or another size metric) kept the node objects, so the
    // layout went on from where the nodes were.
    const nodesBeforeRestartRef = useRef<ReadonlyMap<string, LayoutNode>>(undefined);

    // Deviation ADR-011 A22: a view shown before in this analysis comes back as it was left, with
    // its positions and zoom, instead of a new layout from scratch. The legacy app laid it out
    // again, which takes seconds for a large app graph.
    const savedViews = useSavedViews(analysis);

    // A new copy for every graph: the layout writes positions into its nodes and links, so they
    // must not be the value of an atom (architecture §5; the legacy app copied on every graph,
    // graph.component.ts:166-171). Clusters and constraints leave out the removed nodes, as the
    // legacy restart computed them again (createSimulation, 563-574).
    const built = useMemo(() => {
        if (!viewGraph) {
            return undefined;
        }
        const model = buildViewModel(withoutNodes(viewGraph.graph, removedIds), {
            view: viewGraph.view,
            sizeMetric,
            nodeSizesBasedOnMetrics,
        });
        // A restart (removal, size metric) goes on from the current positions instead.
        const restored = restoreView(
            nodesBeforeRestartRef.current ? undefined : savedViews.get(viewGraph.graph),
            model.nodes,
            { sizeMetric, nodeSizesBasedOnMetrics }
        );
        return { model, restored };
    }, [viewGraph, removedIds, sizeMetric, nodeSizesBasedOnMetrics, savedViews]);
    const model = built?.model;
    const restored = built?.restored;

    // Like the legacy app, the layout takes the area size when it starts and does not restart when
    // the area is resized; hence `size !== undefined` instead of `size` in the deps. A new engine
    // for the same model starts from the positions of the old one, as the legacy restartGraph did.
    // While the engine ticks, the frames move the drawn graph without React (P08-S09).
    const layout = useLayout(
        () => {
            if (!model || !size) {
                return undefined;
            }
            if (nodesBeforeRestartRef.current) {
                placeLike(model.nodes, nodesBeforeRestartRef.current);
                nodesBeforeRestartRef.current = undefined;
            }
            return createLayout(flowLayout, {
                nodes: model.nodes,
                links: model.links,
                constraints: model.constraints,
                ...size,
                restore: layoutRestore(restored),
            });
        },
        [built, size !== undefined, flowLayout, createLayout],
        () =>
            model !== undefined &&
            viewGraph !== undefined &&
            writePositions(panZoom.zoomGroupRef.current, model.nodes, model.links, viewGraph.view)
    );

    // G18: measure the labels again at every end of the layout (also after dragging) and when the
    // zoom level changes (legacy lastZoomValue); panning moves all labels alike.
    const labelCollision = useLabelCollision({
        enabled: hideOverlappingLabels,
        run: layout.run,
        measure: measureLabel,
    });
    const { update: updateLabels } = labelCollision;
    useEffect(() => {
        if (layout.ends > 0) {
            updateLabels();
        }
    }, [layout.ends, updateLabels]);

    const [zoomStyle, setZoomStyle] = useState<ZoomStyle>({});
    const lastZoomRef = useRef<number>(undefined);
    const handleZoom = useCallback(
        (transform: ZoomTransform) => {
            setZoomStyle(current => nextZoomStyle(current, transform.k));
            if (transform.k !== lastZoomRef.current) {
                lastZoomRef.current = transform.k;
                updateLabels();
            }
        },
        [updateLabels]
    );
    const panZoom = usePanZoom({ measure, onZoom: handleZoom });

    // A restart draws new labels and links, which the legacy app gave the default sizes again; a
    // restored view gets the sizes it had.
    const [styleRun, setStyleRun] = useState(layout.run);
    if (styleRun !== layout.run) {
        setStyleRun(layout.run);
        setZoomStyle(restoredZoomStyle(restored));
    }

    // A restored view shows its zoom again and is saved when it is left (ADR-011 A22).
    const { restore: restoreZoom, getTransform } = panZoom;
    useRestoreZoom(restored, restoreZoom);

    useSaveView({
        views: savedViews,
        graph: viewGraph?.graph,
        nodes: model?.nodes,
        ended: layout.ended,
        zoomStyle,
        getTransform,
        sizeMetric,
        nodeSizesBasedOnMetrics,
    });

    // G17: fit the graph in after the first end of every layout run (legacy firstSimulation); later
    // ends, e.g. after dragging, leave the zoom alone. A view restored at rest keeps its zoom.
    const { zoomToFit } = panZoom;
    const fittedRun = useRef<number>(undefined);
    const keepZoom = isRestoredAtRest(restored);
    useEffect(() => {
        if (layout.ended && fittedRun.current !== layout.run) {
            fittedRun.current = layout.run;
            if (autoZoom && !keepZoom) {
                zoomToFit();
            }
        }
    }, [layout.run, layout.ended, autoZoom, keepZoom, zoomToFit]);

    // G13: switching full screen fits the graph in, also without "Auto zoom" (legacy settings
    // subscription, graph.component.ts:90-93).
    const fullScreenRef = useRef(fullScreen);
    useEffect(() => {
        if (fullScreenRef.current !== fullScreen) {
            fullScreenRef.current = fullScreen;
            zoomToFit();
        }
    }, [fullScreen, zoomToFit]);

    const fade = useFade(model?.links ?? noLinks, layout.run, settings);
    const drag = useNodeDrag({
        getEngine: layout.getEngine,
        getTransform: panZoom.getTransform,
        onDraggingChange: fade.onDraggingChange,
    });

    // The component of the view; an unknown id shows the app view (selectViewGraph).
    const viewComponentId = viewGraph?.view === 'component' ? componentId : undefined;

    // N10 (legacy graph.component.ts:123-130): opening a component view selects its file, also
    // when the view comes from the file tree or the URL.
    useEffect(() => {
        if (viewComponentId !== undefined) {
            selectFile(viewComponentId.split('#')[0] ?? '');
        }
    }, [viewComponentId, selectFile]);

    const selectedIds = useMemo(() => new Set(selection?.map(node => node.id)), [selection]);

    const keepPositions = () => {
        if (model) {
            nodesBeforeRestartRef.current = new Map(model.nodes.map(each => [each.id, each]));
        }
    };

    const removeNode = (node: VisualNode) => {
        if (!viewGraph) {
            return;
        }
        keepPositions();
        setRemoval({ viewGraph, nodeIds: [...removedIds, node.id] });
    };

    // Legacy onMetricSelectionChange (graph.component.ts:1167-1170): restart the layout.
    const changeSizeMetric = (metric: string) => {
        keepPositions();
        setSizeMetric(metric);
    };

    // The same object on every render, so that the memoized nodes keep their props.
    const nodeEvents = useStableHandlers<NodeEvents>({
        onPointerDown: drag.onPointerDown,
        // G1 and G5 (legacy onNodeClick, graph.component.ts:1030-1048).
        onCircleClick: (node, event) => {
            if (event.ctrlKey) {
                // The legacy fading of this click reached only the nodes drawn before the
                // restart, so it does not fade here.
                event.stopPropagation();
                removeNode(node);
                return;
            }
            selectNode(node, viewComponentId);
        },
        // G4 (legacy createPreviewCircles, graph.component.ts:825-827): the function with its
        // component as componentId. The click goes on to the node, which fades to it.
        // Raw graph nodes have no icons, so neither has the selection (Q5).
        onPreviewClick: ({ id, label, type, report }, parent) =>
            selectNode({ id, label, type, report }, parent.id),
        onClick: node => fade.fadeTo(node.id),
        // G3 (legacy createNodeGroup, graph.component.ts:693-701): a component of the app graph
        // with inner functions opens its component view (useUrlState adds `?id=`). Components
        // without a graph have no functions; there the legacy handler threw on
        // `functions.length`, here nothing happens.
        onDoubleClick: node => {
            if (node.id.startsWith('/') && (node.functions?.length ?? 0) >= 1) {
                setComponentId(node.id);
            }
        },
        // G6: fade while the pointer is over a node with Ctrl held.
        onPointerEnter: (node, event) => {
            if (event.ctrlKey) {
                fade.fadeTo(node.id);
            }
        },
        onPointerLeave: (_node, event) => {
            if (event.ctrlKey) {
                fade.fadeIn();
            }
        },
    });

    const events: GraphEvents = {
        onPointerDown: panZoom.onPointerDown,
        // G7 (legacy deselectNodes, graph.component.ts:1172-1177): a click on the background itself.
        onClick: event => {
            if (event.target === event.currentTarget) {
                fade.fadeIn();
                deselect();
            }
        },
        node: nodeEvents,
    };

    // Nodes get their first position when the engine starts; draw them only from then on.
    const placed = model?.nodes.every(node => node.x !== undefined && node.y !== undefined);

    return (
        <div ref={areaRef} className="qv-graph-area">
            {viewGraph && model && (
                <GraphCanvas
                    nodes={placed ? model.nodes : noNodes}
                    links={placed ? model.links : noLinks}
                    view={viewGraph.view}
                    settings={settings}
                    zoom={{
                        ...zoomStyle,
                        transform: panZoom.transform,
                        transition: panZoom.transition,
                    }}
                    svgRef={panZoom.svgRef}
                    zoomGroupRef={panZoom.zoomGroupRef}
                    events={events}
                    highlight={{ selected: selectedIds, fade: fade.faded }}
                    labels={{ hidden: labelCollision.hidden, ref: labelCollision.labelRef }}
                    showCluster={showCluster}
                >
                    <Legend view={viewGraph.view} />
                </GraphCanvas>
            )}
            {viewGraph && (
                <GraphActions
                    view={viewGraph.view}
                    // N13: back to the app view (useUrlState removes `?id=`).
                    onBack={componentId === undefined ? undefined : () => setComponentId(undefined)}
                    layout={{ running: layout.running, onStop: layout.halt }}
                    cluster={{
                        hasCluster: model?.hasCluster ?? false,
                        show: showCluster,
                        onToggle: () => setShowCluster(show => !show),
                    }}
                    sizeMetric={{ value: sizeMetric, onChange: changeSizeMetric }}
                    zoom={{
                        level: zoomLevel(panZoom.transform.k),
                        onZoomTo100: panZoom.zoomTo100,
                        onZoomToFit: panZoom.zoomToFit,
                    }}
                    fullScreen={{ on: fullScreen, onToggle: () => setFullScreen(on => !on) }}
                />
            )}
        </div>
    );
};
