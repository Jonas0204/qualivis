// Prepares a graph for drawing the way GraphComponent does (legacy graph.component.ts:166-171 and
// createSimulation, 563-569), see docs/migration/01-referenz-altsystem/03-visuelle-regeln.md §2,
// §4 and §9.2.
import type { Graph, Link, Node } from '../model/graph';
import { graphSettings } from '../model/graphSettings';
import { computeClusters } from './cluster';
import type { VisualIcon } from './icons';
import { computeNodeVisual, type VisualOptions } from './nodeVisuals';
import { type ReactConstraint, reactConstraints } from './reactConstraints';

/** A graph node with the values of the visual rules. */
export type VisualNode = Omit<Node, 'width' | 'height' | 'warn' | 'error' | 'icons' | 'cluster'> & {
    width: number;
    height: number;
    warn: boolean;
    error: boolean;
    icons?: VisualIcon[];
    cluster?: number;
};

/** A link whose ends are the node objects of the same view model. */
export type VisualLink = Omit<Link, 'source' | 'target'> & {
    source: VisualNode;
    target: VisualNode;
};

export type ViewModel = {
    nodes: VisualNode[];
    links: VisualLink[];
    hasCluster: boolean;
    constraints: ReactConstraint[];
};

/** Port of helper/generateLinkReferences.ts: link ends become node objects for the layout. */
const resolveLinks = (links: readonly Link[], nodes: readonly VisualNode[]): VisualLink[] =>
    links.flatMap(link => {
        const source = nodes.find(node => node.id === link.source);
        const target = nodes.find(node => node.id === link.target);

        if (!source) {
            // biome-ignore lint/suspicious/noConsole: legacy log, kept for debugging (user, 09.11.2026)
            console.error('Did not find link source in nodes:', link.source);
        }
        if (!target) {
            // biome-ignore lint/suspicious/noConsole: legacy log, kept for debugging (user, 09.11.2026)
            console.error('Did not find link target in nodes:', link.target);
        }

        // The legacy app kept such a link and d3 then threw "node not found"; it is left out here
        // instead (user, 09.11.2026). The fixtures have no such link.
        return source && target ? [{ ...link, source, target }] : [];
    });

/**
 * Everything the graph view draws for one graph: nodes with size, warning level, icons and (only
 * in the component view) Louvain cluster, links between those nodes and the React constraints of
 * the component view. Works on a JSON copy like the legacy app, because the layout writes
 * positions into nodes and links; the graph itself stays unchanged.
 */
export const buildViewModel = (graph: Graph, options: VisualOptions): ViewModel => {
    // A JSON copy as in the legacy app: it also drops undefined values.
    const copy: Graph = JSON.parse(JSON.stringify(graph));
    const nodes: VisualNode[] = copy.nodes.map(node => ({
        ...node,
        ...computeNodeVisual(node, options),
    }));
    const links = resolveLinks(copy.links, nodes);

    if (options.view !== 'component') {
        return { nodes, links, hasCluster: false, constraints: [] };
    }

    const { clusters, hasCluster } = computeClusters(nodes, links);
    for (const node of nodes) {
        const cluster = clusters[node.id];
        // The nodes are fresh copies, and the links point to them, so they are changed in place.
        if (typeof cluster === 'number') {
            node.cluster = cluster;
        }
    }

    return {
        nodes,
        links,
        hasCluster,
        constraints: reactConstraints(nodes, graphSettings.nodeGap),
    };
};
