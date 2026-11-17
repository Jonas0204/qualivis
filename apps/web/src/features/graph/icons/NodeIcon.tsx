import { graphSettings } from '@qualivis/core';
import { useContext } from 'react';
import { GraphDefsContext } from '../canvas/graphDefsContext';

export type NodeIconProps = {
    type: 'component' | 'innerFunction';
    kind?: string;
    special?: boolean;
    returnsJSX?: boolean;
};

const radius = 12;

/** A node of the graph as symbol: main circle, overlay and, for JSX, the inner circle. */
export const NodeIcon = ({ type, kind, special, returnsJSX }: NodeIconProps) => {
    const { hatch } = useContext(GraphDefsContext);
    const suffix = special ? `${type} special` : type;

    return (
        <>
            <circle className={`circle-node ${suffix}`} r={radius} />
            <circle
                className={`circle-overlay ${suffix}`}
                r={radius}
                fill={
                    type === 'component' && kind === 'ClassComponent'
                        ? `url(#${hatch})`
                        : 'transparent'
                }
                strokeWidth={graphSettings.circleStrokeWidth}
            />
            {returnsJSX && (
                <circle
                    className={`inner-circle ${suffix}`}
                    r={radius - 3}
                    fill="none"
                    strokeWidth={graphSettings.circleStrokeWidth}
                />
            )}
        </>
    );
};
