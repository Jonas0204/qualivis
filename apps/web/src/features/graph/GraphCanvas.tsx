import {
    clusterPaint,
    graphSettings,
    type View,
    type VisualLink,
    type VisualNode,
} from '@qualivis/core';
import {
    type MouseEvent as ReactMouseEvent,
    type PointerEvent as ReactPointerEvent,
    type Ref,
    type RefCallback,
    useId,
    useMemo,
} from 'react';
import { GraphDefs } from './GraphDefs';
import { GraphLink } from './GraphLink';
import { GraphNode, type GraphNodeSettings, type NodeEvents } from './GraphNode';
import { GraphDefsContext } from './graphDefsContext';
import type { GraphFade } from './useFade';
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

/** Selection (§14) and fading (§12) of the graph. */
export type GraphHighlight = {
    /** Ids of the selected nodes. */
    selected?: ReadonlySet<string>;
    /** Undefined while nothing is faded. */
    fade?: GraphFade<VisualLink>;
};

/** Overlapping labels (§13, useLabelCollision). */
export type GraphLabels = {
    /** Ids of the nodes whose label is hidden. */
    hidden: ReadonlySet<string>;
    /** Ref of the label text of a node, for measuring. */
    ref: (nodeId: string) => RefCallback<SVGTSpanElement>;
};

export type GraphEvents = {
    /** Pointer down on the background (pan). */
    onPointerDown?: (event: ReactPointerEvent<SVGSVGElement>) => void;
    /** Any click in the SVG; on the background when the target is the SVG itself. */
    onClick?: (event: ReactMouseEvent<SVGSVGElement>) => void;
    /** The pointer down of a node has to stop the event, or the background pans too. */
    node?: NodeEvents;
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
    events?: GraphEvents;
    highlight?: GraphHighlight;
    labels?: GraphLabels;
};

const unscaled: GraphZoom = { transform: identityTransform };

/** Fill of indirectly connected nodes while faded (graph.component.ts:787). */
const indirectFill = 'var(--qv-graph-indirect-fill)';

/** Opacity of a node or link while faded; undefined while nothing is faded. */
const fadeOpacity = (fade: GraphFade<VisualLink> | undefined, opaque: boolean | undefined) =>
    fade && (opaque ? 1 : graphSettings.fadeOpacity);

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
    events = {},
    highlight = {},
    labels,
}: GraphCanvasProps) => {
    // Unique ids per graph, so that two graphs in one document do not share their defs. Only
    // letters, digits, "_" and "-", so the ids also work in url(#…).
    const id = useId().replace(/[^\w-]/g, '');
    const defIds = useMemo(
        () => ({ arrowhead: `qv-arrowhead-${id}`, hatch: `qv-hatch-${id}` }),
        [id]
    );
    const { fade, selected } = highlight;

    return (
        <GraphDefsContext value={defIds}>
            {/* biome-ignore lint/a11y/useKeyWithClickEvents: mouse only like the legacy graph; keyboard access follows in P08-S07 */}
            <svg
                ref={svgRef}
                className="qv-graph"
                role="img"
                aria-label="Component graph"
                onPointerDown={events.onPointerDown}
                onClick={events.onClick}
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
                                opacity={fadeOpacity(fade, fade?.opaqueLinks.has(link))}
                            />
                        ))}
                    </g>
                    <g className="nodes">
                        {nodes.map(node => {
                            const paint = clusterPaint(node.cluster, view, showCluster);
                            return (
                                <GraphNode
                                    key={node.id}
                                    node={node}
                                    view={view}
                                    settings={settings}
                                    selected={selected?.has(node.id)}
                                    inlineStyle={{
                                        fill: fade?.indirectNodes.has(node.id)
                                            ? indirectFill
                                            : paint?.fill,
                                        stroke: paint?.stroke,
                                        opacity: fadeOpacity(fade, fade?.opaqueNodes.has(node.id)),
                                        labelFontSize: zoom.labelFontSize,
                                    }}
                                    label={
                                        labels && {
                                            hidden: labels.hidden.has(node.id),
                                            ref: labels.ref(node.id),
                                        }
                                    }
                                    events={events.node}
                                />
                            );
                        })}
                    </g>
                </g>
            </svg>
        </GraphDefsContext>
    );
};
