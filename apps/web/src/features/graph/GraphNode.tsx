import {
    type ClusterPaint,
    graphSettings,
    mainRadius,
    type Settings,
    type View,
    type VisualNode,
} from '@qualivis/core';
import { useContext } from 'react';
import { GraphDefsContext } from './graphDefsContext';
import { PreviewCircles } from './PreviewCircles';

/** The settings that change how a node looks. */
export type GraphNodeSettings = Pick<Settings, 'text' | 'currentSizeMetricErrorHighlighting'>;

type GraphNodeProps = {
    node: VisualNode;
    view: View;
    settings: GraphNodeSettings;
    selected?: boolean;
    /** Inline colours when cluster colours are on (clusterPaint from the core). */
    clusterPaint?: ClusterPaint;
};

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
 * Selection and cluster colours as in updateGraph (graph.component.ts:206-243).
 */
export const GraphNode = ({
    node,
    view,
    settings,
    selected = false,
    clusterPaint,
}: GraphNodeProps) => {
    const { hatch } = useContext(GraphDefsContext);
    const radius = mainRadius(node.width, view);
    const strokeStyle = clusterPaint && { stroke: clusterPaint.stroke };
    const highlight = settings.currentSizeMetricErrorHighlighting;

    return (
        <g className="node" transform={`translate(${node.x ?? 0}, ${node.y ?? 0})`}>
            <circle
                className={circleNodeClass(node, selected)}
                r={radius}
                style={clusterPaint && { fill: clusterPaint.fill }}
            />
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
                <text className="node-label">
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
