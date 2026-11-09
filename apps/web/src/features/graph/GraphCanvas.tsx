import {
    clusterPaint,
    graphSettings,
    type View,
    type VisualLink,
    type VisualNode,
} from '@qualivis/core';
import { type PointerEvent as ReactPointerEvent, type Ref, useId, useMemo } from 'react';
import { GraphDefs } from './GraphDefs';
import { GraphLink } from './GraphLink';
import { GraphNode, type GraphNodeSettings } from './GraphNode';
import { GraphDefsContext } from './graphDefsContext';
import {
    identityTransform,
    transformAttribute,
    type ZoomStyle,
    type ZoomTransform,
} from './zoomMath';

/** Pan and zoom state (usePanZoom) and the label and link sizes it set (nextZoomStyle). */
export type GraphZoom = ZoomStyle & {
    transform: ZoomTransform;
    /** Wheel zooming eases transform and label size (legacy addTransition). */
    transition?: boolean;
};

type GraphCanvasProps = {
    nodes: readonly VisualNode[];
    links: readonly VisualLink[];
    view: View;
    settings: GraphNodeSettings;
    /** Cluster colours ("Toggle cluster", P05-S11); off by default as in the legacy app. */
    showCluster?: boolean;
    /** Without it the graph is drawn unscaled. */
    zoom?: GraphZoom;
    svgRef?: Ref<SVGSVGElement>;
    zoomGroupRef?: Ref<SVGGElement>;
    /** Pointer down on the background (pan). */
    onPointerDown?: (event: ReactPointerEvent<SVGSVGElement>) => void;
    /** Pointer down on a node (drag); it has to stop the event, or the background pans too. */
    onNodePointerDown?: (node: VisualNode, event: ReactPointerEvent<SVGGElement>) => void;
};

const unscaled: GraphZoom = { transform: identityTransform };

/** SVG of the graph at the current node positions; markup and classes as in the legacy app. */
export const GraphCanvas = ({
    nodes,
    links,
    view,
    settings,
    showCluster = false,
    zoom = unscaled,
    svgRef,
    zoomGroupRef,
    onPointerDown,
    onNodePointerDown,
}: GraphCanvasProps) => {
    // Unique ids per graph, so that two graphs in one document do not share their defs. Only
    // letters, digits, "_" and "-", so the ids also work in url(#…).
    const id = useId().replace(/[^\w-]/g, '');
    const defIds = useMemo(
        () => ({ arrowhead: `qv-arrowhead-${id}`, hatch: `qv-hatch-${id}` }),
        [id]
    );

    return (
        <GraphDefsContext value={defIds}>
            <svg
                ref={svgRef}
                className="qv-graph"
                role="img"
                aria-label="Component graph"
                onPointerDown={onPointerDown}
            >
                <GraphDefs />
                {/* legacy #zoomGroup */}
                <g
                    ref={zoomGroupRef}
                    className={zoom.transition ? 'zoom-group zoom-transition' : 'zoom-group'}
                    transform={transformAttribute(zoom.transform)}
                >
                    <g
                        className="links"
                        stroke={graphSettings.linkColor}
                        strokeOpacity={graphSettings.linkOpacity}
                    >
                        {links.map((link, index) => (
                            // Index as key: links keep their order, and the same pair can occur twice.
                            <GraphLink
                                key={index}
                                link={link}
                                view={view}
                                strokeWidth={zoom.linkStrokeWidth}
                            />
                        ))}
                    </g>
                    <g className="nodes">
                        {nodes.map(node => (
                            <GraphNode
                                key={node.id}
                                node={node}
                                view={view}
                                settings={settings}
                                clusterPaint={clusterPaint(node.cluster, view, showCluster)}
                                labelFontSize={zoom.labelFontSize}
                                onPointerDown={
                                    onNodePointerDown && (event => onNodePointerDown(node, event))
                                }
                            />
                        ))}
                    </g>
                </g>
            </svg>
        </GraphDefsContext>
    );
};
