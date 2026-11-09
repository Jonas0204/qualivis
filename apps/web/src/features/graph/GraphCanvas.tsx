import {
    clusterPaint,
    graphSettings,
    type View,
    type VisualLink,
    type VisualNode,
} from '@qualivis/core';
import { useId, useMemo } from 'react';
import { GraphDefs } from './GraphDefs';
import { GraphLink } from './GraphLink';
import { GraphNode, type GraphNodeSettings } from './GraphNode';
import { GraphDefsContext } from './graphDefsContext';

type GraphCanvasProps = {
    nodes: readonly VisualNode[];
    links: readonly VisualLink[];
    view: View;
    viewBox: string;
    settings: GraphNodeSettings;
    /** Cluster colours ("Toggle cluster", P05-S11); off by default as in the legacy app. */
    showCluster?: boolean;
};

/** SVG of the graph at the current node positions; markup and classes as in the legacy app. */
export const GraphCanvas = ({
    nodes,
    links,
    view,
    viewBox,
    settings,
    showCluster = false,
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
            <svg className="qv-graph" role="img" aria-label="Component graph" viewBox={viewBox}>
                <GraphDefs />
                <g
                    className="links"
                    stroke={graphSettings.linkColor}
                    strokeOpacity={graphSettings.linkOpacity}
                >
                    {links.map((link, index) => (
                        // Index as key: links keep their order, and the same pair can occur twice.
                        <GraphLink key={index} link={link} view={view} />
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
                        />
                    ))}
                </g>
            </svg>
        </GraphDefsContext>
    );
};
