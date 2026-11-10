import {
    clusterPaint,
    graphSettings,
    type View,
    type VisualLink,
    type VisualNode,
} from '@qualivis/core';
import {
    type CSSProperties,
    memo,
    type MouseEvent as ReactMouseEvent,
    type ReactNode,
    type PointerEvent as ReactPointerEvent,
    type Ref,
    type RefCallback,
    useCallback,
    useId,
    useMemo,
    useRef,
} from 'react';
import { GraphDefs } from './GraphDefs';
import { GraphLink } from './GraphLink';
import { GraphNode, type GraphNodeSettings, type NodeEvents } from './GraphNode';
import { GraphDefsContext } from './graphDefsContext';
import type { GraphFade } from './useFade';
import { useZoomTransition, type ZoomFrame } from './useZoomTransition';
import {
    identityTransform,
    transformAttribute,
    type ZoomStyle,
    type ZoomTransform,
} from './zoomMath';

/** Pan and zoom state (usePanZoom) and the label and link sizes it set (nextZoomStyle). */
export type GraphZoom = ZoomStyle & {
    transform: ZoomTransform;
    /** Wheel zooming eases transform, label size and link width (useZoomTransition). */
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
    /** Cluster colours ("Toggle cluster"); off by default as in the legacy app. */
    showCluster?: boolean;
    /** Without it the graph is drawn unscaled. */
    zoom?: GraphZoom;
    svgRef?: Ref<SVGSVGElement>;
    zoomGroupRef?: Ref<SVGGElement>;
    events?: GraphEvents;
    highlight?: GraphHighlight;
    labels?: GraphLabels;
    /** Drawn after the SVG with the ids of its defs, e.g. the legend. */
    children?: ReactNode;
};

const unscaled: GraphZoom = { transform: identityTransform };

/** Fill of indirectly connected nodes while faded (graph.component.ts:787). */
const indirectFill = 'var(--qv-graph-indirect-fill)';

/**
 * Transform and the label size and link width set by zooming, without a size from zooming the
 * defaults (14 px, 0.8). The sizes are CSS variables of the zoom group (graph.css): one style
 * change instead of one per label and link, so zooming does not render every node again.
 */
const zoomFrame = (zoom: GraphZoom): ZoomFrame => ({
    transform: zoom.transform,
    labelFontSize: zoom.labelFontSize ?? graphSettings.normalTextSize,
    linkStrokeWidth: zoom.linkStrokeWidth ?? graphSettings.linkStrokeWidth,
});

const zoomGroupStyle = ({ labelFontSize, linkStrokeWidth }: ZoomFrame) =>
    ({
        '--qv-label-font-size': `${labelFontSize}px`,
        '--qv-link-stroke-width': linkStrokeWidth,
    }) as CSSProperties;

/** Opacity of a node or link while faded; undefined while nothing is faded. */
const fadeOpacity = (fade: GraphFade<VisualLink> | undefined, opaque: boolean | undefined) =>
    fade && (opaque ? 1 : graphSettings.fadeOpacity);

type GraphContentProps = Pick<GraphCanvasProps, 'nodes' | 'links' | 'view' | 'settings'> &
    Pick<GraphHighlight, 'selected' | 'fade'> & {
        showCluster: boolean;
        hiddenLabels?: GraphLabels['hidden'];
        labelRef?: GraphLabels['ref'];
        nodeEvents?: NodeEvents;
    };

/**
 * Links and nodes of the graph. Memoized on props that pan and zoom leave alone, so that a wheel
 * step or a pan move renders only the zoom group, not every node and link (P08-S09).
 */
const GraphContent = memo(
    ({
        nodes,
        links,
        view,
        settings,
        showCluster,
        selected,
        fade,
        hiddenLabels,
        labelRef,
        nodeEvents,
    }: GraphContentProps) => (
        <>
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
                                fill: fade?.indirectNodes.has(node.id) ? indirectFill : paint?.fill,
                                stroke: paint?.stroke,
                                opacity: fadeOpacity(fade, fade?.opaqueNodes.has(node.id)),
                            }}
                            label={
                                hiddenLabels &&
                                labelRef && {
                                    hidden: hiddenLabels.has(node.id),
                                    ref: labelRef(node.id),
                                }
                            }
                            events={nodeEvents}
                        />
                    );
                })}
            </g>
        </>
    )
);

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
    children,
}: GraphCanvasProps) => {
    // Unique ids per graph, so that two graphs in one document do not share their defs. Only
    // letters, digits, "_" and "-", so the ids also work in url(#…).
    const id = useId().replace(/[^\w-]/g, '');
    const defIds = useMemo(
        () => ({ arrowhead: `qv-arrowhead-${id}`, hatch: `qv-hatch-${id}` }),
        [id]
    );
    const { fade, selected } = highlight;
    const frame = zoomFrame(zoom);
    const groupRef = useRef<SVGGElement>(null);
    useZoomTransition(groupRef, frame, zoom.transition ?? false);
    const setGroup = useCallback(
        (group: SVGGElement | null) => {
            groupRef.current = group;
            if (typeof zoomGroupRef === 'function') {
                zoomGroupRef(group);
            } else if (zoomGroupRef) {
                zoomGroupRef.current = group;
            }
        },
        [zoomGroupRef]
    );

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
                    ref={setGroup}
                    className="zoom-group"
                    transform={transformAttribute(frame.transform)}
                    style={zoomGroupStyle(frame)}
                >
                    <GraphContent
                        nodes={nodes}
                        links={links}
                        view={view}
                        settings={settings}
                        showCluster={showCluster}
                        selected={selected}
                        fade={fade}
                        hiddenLabels={labels?.hidden}
                        labelRef={labels?.ref}
                        nodeEvents={events.node}
                    />
                </g>
            </svg>
            {children}
        </GraphDefsContext>
    );
};
