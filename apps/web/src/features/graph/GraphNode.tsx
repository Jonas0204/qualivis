import {
    graphSettings,
    mainRadius,
    type Settings,
    type View,
    type VisualNode,
} from '@qualivis/core';
import {
    type CSSProperties,
    type MouseEvent as ReactMouseEvent,
    type PointerEvent as ReactPointerEvent,
    useContext,
} from 'react';
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
    /** Label size in px set by zooming (zoomMath nextZoomStyle); without it the CSS 14 px. */
    labelFontSize?: number;
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
    /** Click anywhere on the node, preview circles too (legacy click.fade). */
    onClick?: (node: VisualNode, event: ReactMouseEvent<SVGGElement>) => void;
    onPointerEnter?: (node: VisualNode, event: ReactPointerEvent<SVGGElement>) => void;
    onPointerLeave?: (node: VisualNode, event: ReactPointerEvent<SVGGElement>) => void;
};

type GraphNodeProps = {
    node: VisualNode;
    view: View;
    settings: GraphNodeSettings;
    selected?: boolean;
    inlineStyle?: NodeInlineStyle;
    events?: NodeEvents;
};

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
 * createFading (711-804).
 */
export const GraphNode = ({
    node,
    view,
    settings,
    selected = false,
    inlineStyle = {},
    events = {},
}: GraphNodeProps) => {
    const { hatch } = useContext(GraphDefsContext);
    const radius = mainRadius(node.width, view);
    const strokeStyle = styleOf({ stroke: inlineStyle.stroke });
    const highlight = settings.currentSizeMetricErrorHighlighting;

    return (
        // biome-ignore lint/a11y/noStaticElementInteractions: mouse only like the legacy graph; keyboard access to the nodes follows in P08-S07
        <g
            className="node"
            transform={`translate(${node.x ?? 0}, ${node.y ?? 0})`}
            style={styleOf({ opacity: inlineStyle.opacity })}
            onPointerDown={bind(node, events.onPointerDown)}
            onClick={bind(node, events.onClick)}
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
            {view === 'app' && node.functions && <PreviewCircles node={node} />}
            {settings.text && (
                <text
                    className="node-label"
                    style={styleOf({
                        fontSize:
                            inlineStyle.labelFontSize === undefined
                                ? undefined
                                : `${inlineStyle.labelFontSize}px`,
                    })}
                >
                    <tspan className="label-text">{node.label || node.id}</tspan>
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
        </g>
    );
};
