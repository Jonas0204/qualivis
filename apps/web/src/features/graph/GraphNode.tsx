import {
    graphSettings,
    mainRadius,
    type Node,
    type Settings,
    type View,
    type VisualNode,
} from '@qualivis/core';
import {
    type CSSProperties,
    memo,
    type MouseEvent as ReactMouseEvent,
    type PointerEvent as ReactPointerEvent,
    type Ref,
    useContext,
} from 'react';
import { propsEqualOneLevel } from '../../lib/propsEqualOneLevel';
import { GraphDefsContext } from './graphDefsContext';
import { PreviewCircles } from './PreviewCircles';

/** The settings that change how a node looks. */
export type GraphNodeSettings = Pick<Settings, 'text' | 'currentSizeMetricErrorHighlighting'>;

/** Inline styles set at run time, where the legacy app set them with d3 style(). */
export type NodeInlineStyle = {
    /** Fill of the main circle: cluster colour (clusterPaint) or the fill of an indirect node. */
    fill?: string;
    /** Border of overlay and inner circle: cluster colour. */
    stroke?: string;
    /** Opacity while the graph is faded (useFade). */
    opacity?: number;
};

/** What a node reports to the graph view; every handler gets the node. */
export type NodeEvents = {
    /** Pointer down anywhere on the node: starts dragging (useNodeDrag). */
    onPointerDown?: (node: VisualNode, event: ReactPointerEvent<SVGGElement>) => void;
    /**
     * Click on the overlay circle (legacy onNodeClick). The legacy handler on the label text never
     * fired, since `.node-label` has `pointer-events: none`; a click there hits what lies below.
     */
    onCircleClick?: (node: VisualNode, event: ReactMouseEvent<SVGCircleElement>) => void;
    /**
     * Click on a preview circle of an app view node (G4, legacy createPreviewCircles): the
     * function and its component. The click goes on to the node (`onClick`).
     */
    onPreviewClick?: (fn: Node, node: VisualNode, event: ReactMouseEvent<SVGCircleElement>) => void;
    /** Click anywhere on the node, preview circles too (legacy click.fade). */
    onClick?: (node: VisualNode, event: ReactMouseEvent<SVGGElement>) => void;
    /** Double click anywhere on the node (legacy dblclick of the node group). */
    onDoubleClick?: (node: VisualNode, event: ReactMouseEvent<SVGGElement>) => void;
    onPointerEnter?: (node: VisualNode, event: ReactPointerEvent<SVGGElement>) => void;
    onPointerLeave?: (node: VisualNode, event: ReactPointerEvent<SVGGElement>) => void;
};

/** Overlapping labels (§13, useLabelCollision). */
export type NodeLabel = {
    /** Hides the label text; the node shows it as tooltip instead. */
    hidden?: boolean;
    /** Ref of the label text, for measuring. */
    ref?: Ref<SVGTSpanElement>;
};

type GraphNodeProps = {
    node: VisualNode;
    view: View;
    settings: GraphNodeSettings;
    selected?: boolean;
    inlineStyle?: NodeInlineStyle;
    label?: NodeLabel;
    events?: NodeEvents;
};

const hiddenLabelStyle: CSSProperties = { display: 'none' };

/** `transform` of a node group at the node position. */
export const nodeTransform = (node: { x?: number; y?: number }): string =>
    `translate(${node.x ?? 0}, ${node.y ?? 0})`;

/** A node handler of the graph view as a React handler for this node. */
const bind = <E,>(node: VisualNode, handler?: (node: VisualNode, event: E) => void) =>
    handler && ((event: E) => handler(node, event));

/** No style without a value, so that the element gets no style attribute. */
const styleOf = (values: CSSProperties): CSSProperties | undefined =>
    Object.values(values).some(value => value !== undefined) ? values : undefined;

const circleNodeClass = (node: VisualNode, selected: boolean): string => {
    let className = `circle-node ${node.type}`;
    if (selected) {
        className += ' selected';
    }
    if (node.special) {
        className += ' special';
    }
    return className;
};

/** Class of the overlay and the inner circle; warn and error only with error highlighting. */
const ringClass = (base: string, node: VisualNode, highlight: boolean | undefined): string => {
    let className = `${base} ${node.type}`;
    if (node.special) {
        className += ' special';
    }
    if (highlight) {
        if (node.warn) {
            className += ' warn';
        } else if (node.error) {
            className += ' error';
        }
    }
    return className;
};

/**
 * One node of the graph in the order of the legacy createNodes (graph.component.ts:673-950):
 * main circle, overlay, inner circle for JSX, preview circles (app view) and label with icons.
 * Selection and cluster colours as in updateGraph (graph.component.ts:206-243), fading as in
 * createFading (711-804), hidden labels as in hideOverlappingLabels (952-982). The label size
 * set by zooming comes from the zoom group (GraphCanvas).
 */
const GraphNodeView = ({
    node,
    view,
    settings,
    selected = false,
    inlineStyle = {},
    label = {},
    events = {},
}: GraphNodeProps) => {
    const { hatch } = useContext(GraphDefsContext);
    const radius = mainRadius(node.width, view);
    const strokeStyle = styleOf({ stroke: inlineStyle.stroke });
    const highlight = settings.currentSizeMetricErrorHighlighting;
    const labelText = node.label || node.id;
    const labelHidden = settings.text && label.hidden;

    return (
        // biome-ignore lint/a11y/noStaticElementInteractions: mouse only like the legacy graph; keyboard access to the nodes follows in P08-S07
        <g
            className="node"
            transform={nodeTransform(node)}
            style={styleOf({ opacity: inlineStyle.opacity })}
            onPointerDown={bind(node, events.onPointerDown)}
            onClick={bind(node, events.onClick)}
            onDoubleClick={bind(node, events.onDoubleClick)}
            onPointerEnter={bind(node, events.onPointerEnter)}
            onPointerLeave={bind(node, events.onPointerLeave)}
        >
            <circle
                className={circleNodeClass(node, selected)}
                r={radius}
                style={styleOf({ fill: inlineStyle.fill })}
            />
            {/* biome-ignore lint/a11y/noStaticElementInteractions: mouse only like the legacy graph; keyboard access to the nodes follows in P08-S07 */}
            <circle
                className={ringClass('circle-overlay', node, highlight)}
                r={radius}
                fill={
                    node.type === 'component' && node.kind === 'ClassComponent'
                        ? `url(#${hatch})`
                        : 'transparent'
                }
                strokeWidth={
                    selected
                        ? graphSettings.selectedCircleStrokeWidth
                        : graphSettings.circleStrokeWidth
                }
                style={strokeStyle}
                onClick={bind(node, events.onCircleClick)}
            />
            {node.returnsJSX && (
                <circle
                    className={ringClass('inner-circle', node, highlight)}
                    r={radius - 3}
                    fill="none"
                    strokeWidth={graphSettings.circleStrokeWidth}
                    style={strokeStyle}
                />
            )}
            {view === 'app' && node.functions && (
                <PreviewCircles
                    node={node}
                    onClick={
                        events.onPreviewClick &&
                        ((fn, event) => events.onPreviewClick?.(fn, node, event))
                    }
                />
            )}
            {settings.text && (
                <text className="node-label">
                    <tspan
                        ref={label.ref}
                        className="label-text"
                        style={labelHidden ? hiddenLabelStyle : undefined}
                    >
                        {labelText}
                    </tspan>
                    <tspan dy="1.2em" x={0}>
                        {(node.icons ?? []).map((icon, index) => (
                            // Index as key: a node can have the same icon twice.
                            <tspan key={index} className={`icon ${icon.class}`}>
                                {icon.icon}
                            </tspan>
                        ))}
                    </tspan>
                </text>
            )}
            {/* The legacy app appended the tooltip to the node, after the label. */}
            {labelHidden && <title>{labelText}</title>}
        </g>
    );
};

/**
 * Renders again only when a prop changes; `inlineStyle` and `label` count by their values. The node
 * object stays the same while the layout runs, so its position comes from writePositions then.
 */
export const GraphNode = memo(
    GraphNodeView,
    propsEqualOneLevel<GraphNodeProps>('inlineStyle', 'label')
);
