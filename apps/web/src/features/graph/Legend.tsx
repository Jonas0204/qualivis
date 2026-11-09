import type { View } from '@qualivis/core';
import { useContext, useId } from 'react';
import { GraphDefsContext } from './graphDefsContext';

type LegendProps = { view: View };

/** Height and y of the entries per view (legacy `id ? … : …`). */
const layout = {
    app: {
        height: 246,
        reactFunction: 92,
        reactJsxFunction: 112,
        innerFunction: 136,
        jsxFunction: 156,
        link: 180,
    },
    component: {
        height: 270,
        reactFunction: 96,
        reactJsxFunction: 128,
        innerFunction: 160,
        jsxFunction: 192,
        link: 224,
    },
};

const entry = (y: number) => ({
    className: 'legend-entry',
    style: { transform: `translateY(${y}px)` },
});

const Description = ({ text }: { text: string }) => (
    <text x={33} y={12} className="description">
        {text}
    </text>
);

/**
 * Legend of the graph (§15, legacy graph.component.html:31-163), with the node classes of the
 * graph: the app view draws inner functions as preview circles, the component view as nodes. Hatch
 * and arrow are the defs of the graph (GraphDefsContext).
 */
export const Legend = ({ view }: LegendProps) => {
    const ids = useContext(GraphDefsContext);
    const headerId = useId();
    const component = view === 'component';
    const at = layout[view];
    const r = component ? 12 : 5;
    const opacity = component ? 1 : 0.5;
    const link = (dashed: boolean) => (
        <line
            strokeWidth={0.8}
            stroke="#999"
            strokeOpacity={0.6}
            markerEnd={`url(#${ids.arrowhead})`}
            x1={1}
            y1={12}
            x2={25}
            y2={12}
            strokeDasharray={dashed ? '4 2' : undefined}
        />
    );

    return (
        // biome-ignore lint/a11y/noSvgWithoutTitle: named by its header (aria-labelledby); a title would add a tooltip the legacy legend has not
        <svg
            className="qv-legend"
            width={196}
            height={at.height}
            viewBox={`-16 -14 196 ${at.height}`}
            aria-labelledby={headerId}
        >
            <text id={headerId} className="legend-header" y={16}>
                Legend
            </text>
            <g {...entry(32)}>
                <circle className="circle-node circle-overlay component" r={12} cx={13} cy={12} />
                <Description text="Function Component" />
            </g>
            <g {...entry(64)}>
                <circle className="circle-node component" r={12} cx={13} cy={12} />
                <circle
                    className="circle-overlay component"
                    r={12}
                    cx={13}
                    cy={12}
                    fill={`url(#${ids.hatch})`}
                />
                <Description text="Class Component" />
            </g>
            <g {...entry(at.reactFunction)}>
                <circle
                    className="function innerFunction special"
                    r={r}
                    cx={13}
                    cy={12}
                    opacity={opacity}
                />
                <Description text="Inner React Function" />
            </g>
            <g {...entry(at.reactJsxFunction)}>
                <circle
                    className={`circle-node circle-overlay innerFunction special jsx${component ? '' : ' function'}`}
                    r={r}
                    cx={13}
                    cy={12}
                    opacity={opacity}
                />
                {component && (
                    <circle
                        className="inner-circle innerFunction special"
                        r={9}
                        cx={13}
                        cy={12}
                        fill="none"
                    />
                )}
                <Description text="Inner React JSX Function" />
            </g>
            <g {...entry(at.innerFunction)}>
                <circle
                    className="function innerFunction"
                    r={r}
                    cx={13}
                    cy={12}
                    opacity={opacity}
                />
                <Description text="Inner Function" />
            </g>
            <g {...entry(at.jsxFunction)}>
                <circle
                    className={`circle-node circle-overlay innerFunction jsx${component ? '' : ' function'}`}
                    r={r}
                    cx={13}
                    cy={12}
                    opacity={opacity}
                />
                {component && (
                    <circle
                        className="inner-circle innerFunction"
                        r={9}
                        cx={13}
                        cy={12}
                        fill="none"
                    />
                )}
                <Description text="Inner JSX Function" />
            </g>
            <g {...entry(at.link)}>
                {link(false)}
                <Description text={component ? 'Function Use' : 'Composition'} />
            </g>
            {!component && (
                <g {...entry(200)}>
                    {link(true)}
                    <Description text="Inheritance" />
                </g>
            )}
        </svg>
    );
};
