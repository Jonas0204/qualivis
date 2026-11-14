import {
    graphSettings,
    type Node,
    previewCircles,
    previewDots,
    type VisualNode,
} from '@qualivis/core';
import type { MouseEvent as ReactMouseEvent } from 'react';

type PreviewCirclesProps = {
    /** The app view node; its functions get the circles. */
    node: VisualNode;
    /** Click on the circle of a function (G4). */
    onClick?: (fn: Node, event: ReactMouseEvent<SVGCircleElement>) => void;
};

/**
 * Small circles of the functions around an app view node and "..." where they no longer fit
 * (legacy createPreviewCircles and createThreeDots, graph.component.ts:811-857 and 984-1028).
 */
export const PreviewCircles = ({ node, onClick }: PreviewCirclesProps) => {
    const functions = node.functions ?? [];
    const circles = previewCircles(node.width, functions);
    const dots = previewDots(node.width, functions);

    return (
        <>
            <g>
                {circles.map((circle, index) => (
                    // biome-ignore lint/a11y/noStaticElementInteractions: mouse only like the legacy graph; keyboard access to the nodes follows in P08-S07
                    <circle
                        // Index as key: the circles keep the order of the functions.
                        key={index}
                        r={graphSettings.previewCircleRadius}
                        className={circle.className}
                        strokeWidth={graphSettings.circleStrokeWidth}
                        cx={circle.cx}
                        cy={circle.cy}
                        opacity={0.5}
                        style={circle.hidden ? { display: 'none' } : undefined}
                        onClick={
                            onClick &&
                            (event => {
                                const fn = functions[index];
                                if (fn) {
                                    onClick(fn, event);
                                }
                            })
                        }
                    >
                        <title>{circle.id}</title>
                    </circle>
                ))}
            </g>
            <g>
                {dots && (
                    <text className={dots.className} x={dots.x} y={dots.y} opacity={0.5}>
                        ...
                    </text>
                )}
            </g>
        </>
    );
};
