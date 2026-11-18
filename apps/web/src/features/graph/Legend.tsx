import type { View } from '@qualivis/core';
import type { CSSProperties } from 'react';
import { Icon, IconProvider } from '../../../../../common-components';
import { type GraphIconName, graphIcons } from './icons/graphIcons';

type LegendProps = { view: View };
/** `appIcon`: the symbol of the app view, if it differs (inner functions as preview circles). */
type LegendEntry = { label: string; icon: GraphIconName; appIcon?: GraphIconName };

const nodeEntries: LegendEntry[] = [
    { label: 'Function Component', icon: 'graph_function_component' },
    { label: 'Class Component', icon: 'graph_class_component' },
    {
        label: 'Inner React Function',
        icon: 'graph_inner_react_function',
        appIcon: 'graph_inner_react_function_preview',
    },
    {
        label: 'Inner React JSX Function',
        icon: 'graph_inner_react_jsx_function',
        appIcon: 'graph_inner_react_jsx_function_preview',
    },
    {
        label: 'Inner Function',
        icon: 'graph_inner_function',
        appIcon: 'graph_inner_function_preview',
    },
    {
        label: 'Inner JSX Function',
        icon: 'graph_inner_jsx_function',
        appIcon: 'graph_inner_jsx_function_preview',
    },
];

const linkEntries = (view: View): LegendEntry[] =>
    view === 'component'
        ? [{ label: 'Function Use', icon: 'graph_link' }]
        : [
              { label: 'Composition', icon: 'graph_link' },
              { label: 'Inheritance', icon: 'graph_link_dashed' },
          ];

const legendStyle: CSSProperties = {
    position: 'absolute',
    right: 0,
    bottom: 0,
    width: 196,
    padding: '14px 16px',
    borderTop: 'var(--borderWidth) solid var(--colorBorder)',
    borderLeft: 'var(--borderWidth) solid var(--colorBorder)',
    borderTopLeftRadius: 'var(--radiusLarge)',
    background: 'var(--qv-legend-bg)',
    color: 'var(--colorText)',
    cursor: 'default',
};

const entriesStyle: CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
    margin: 0,
    padding: 0,
    listStyle: 'none',
};

const entryStyle: CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    fontSize: 12,
    fontWeight: 300,
};

export const Legend = ({ view }: LegendProps) => {
    return (
        <div className="qv-legend" style={legendStyle}>
            <h3 style={{ margin: '0 0 8px', fontSize: 16, fontWeight: 400 }}>Legend</h3>
            <IconProvider icons={graphIcons}>
                <ul style={entriesStyle}>
                    {[...nodeEntries, ...linkEntries(view)].map(({ label, icon, appIcon }) => (
                        <li key={label} style={entryStyle}>
                            <Icon name={view === 'app' ? (appIcon ?? icon) : icon} size={26} />
                            {label}
                        </li>
                    ))}
                </ul>
            </IconProvider>
        </div>
    );
};
