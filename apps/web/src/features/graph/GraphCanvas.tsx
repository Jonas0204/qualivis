import { graphSettings } from '@qualivis/core';
import type { ViewLink, ViewNode } from './buildViewGraph';
import { shortenToTarget } from './geometry';

type GraphCanvasProps = {
  nodes: readonly ViewNode[];
  links: readonly ViewLink[];
  viewBox: string;
};

// Until P05 every circle has the same radius (no sizes from metrics yet).
const radius = graphSettings.circleRadius;
// A link ends at the outer edge of the target's stroke (§8: mainRadius + 0.5).
const linkEndRadius = radius + graphSettings.circleStrokeWidth / 2;

const position = (node: ViewNode) => ({ x: node.x ?? 0, y: node.y ?? 0 });

/** SVG of the graph at the current node positions; markup and classes as in the legacy app. */
export const GraphCanvas = ({ nodes, links, viewBox }: GraphCanvasProps) => (
  <svg className="qv-graph" role="img" aria-label="Component graph" viewBox={viewBox}>
    <defs>
      <marker
        id="arrowhead"
        viewBox="-0 -5 10 10"
        refX={9}
        refY={0}
        orient="auto"
        markerWidth={8}
        markerHeight={8}
      >
        <path d="M 0,-5 L 10 ,0 L 0,5" fill={graphSettings.linkColor} stroke="none" />
      </marker>
    </defs>
    <g className="links" stroke={graphSettings.linkColor} strokeOpacity={graphSettings.linkOpacity}>
      {links.map((link, index) => {
        const start = position(link.source);
        const end = shortenToTarget(start, position(link.target), linkEndRadius);
        return (
          <line
            // Index as key: links keep their order, and the same pair can occur twice.
            key={index}
            x1={start.x}
            y1={start.y}
            x2={end.x}
            y2={end.y}
            strokeWidth={graphSettings.linkStrokeWidth}
            strokeDasharray={link.inherits ? '4 2' : undefined}
            markerEnd="url(#arrowhead)"
          />
        );
      })}
    </g>
    <g className="nodes">
      {nodes.map(node => {
        const { x, y } = position(node);
        return (
          <g key={node.id} className="node" transform={`translate(${x}, ${y})`}>
            <circle className="circle-node component" r={radius} />
            <circle
              className="circle-overlay component"
              r={radius}
              fill="transparent"
              strokeWidth={graphSettings.circleStrokeWidth}
            />
            <text className="node-label">{node.label || node.id}</text>
          </g>
        );
      })}
    </g>
  </svg>
);
