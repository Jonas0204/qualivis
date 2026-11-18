import type { IconSet } from '../../../../../../common-components';
import { FunctionIcon } from './FunctionIcon';
import { LinkIcon } from './LinkIcon';
import { NodeIcon } from './NodeIcon';

/** One box for every symbol: 26 × 26 centred on 0, a node of radius 12 with its border. */
const viewBox = '-13 -13 26 26';

/**
 * The symbols of the graph as own icons for the Icon of common-components (IconProvider). The names
 * start with `graph_`, so that they never cover a Material icon (Material has `link`). `_preview` is
 * the form of the app view, where inner functions are small preview circles. The symbols use the
 * defs of the graph (GraphDefsContext) and the node classes of graph.css (.qv-legend).
 */
export const graphIcons = {
    graph_function_component: {
        viewBox,
        content: <NodeIcon type="component" kind="FunctionComponent" />,
    },
    graph_class_component: {
        viewBox,
        content: <NodeIcon type="component" kind="ClassComponent" />,
    },
    graph_inner_react_function: { viewBox, content: <FunctionIcon special component /> },
    graph_inner_react_function_preview: {
        viewBox,
        content: <FunctionIcon special component={false} />,
    },
    graph_inner_react_jsx_function: {
        viewBox,
        content: <FunctionIcon special returnsJSX component />,
    },
    graph_inner_react_jsx_function_preview: {
        viewBox,
        content: <FunctionIcon special returnsJSX component={false} />,
    },
    graph_inner_function: { viewBox, content: <FunctionIcon component /> },
    graph_inner_function_preview: { viewBox, content: <FunctionIcon component={false} /> },
    graph_inner_jsx_function: { viewBox, content: <FunctionIcon returnsJSX component /> },
    graph_inner_jsx_function_preview: {
        viewBox,
        content: <FunctionIcon returnsJSX component={false} />,
    },
    graph_link: { viewBox, content: <LinkIcon /> },
    graph_link_dashed: { viewBox, content: <LinkIcon dashArray="4 2" /> },
} satisfies IconSet;

export type GraphIconName = keyof typeof graphIcons;
