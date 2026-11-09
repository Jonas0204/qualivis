// Port of GraphComponent.generateCluster (legacy graph.component.ts:323-368), see
// docs/migration/01-referenz-altsystem/03-visuelle-regeln.md §4.
import { jLouvain } from 'jlouvain';
import type { Node } from '../model/graph';

export type ClusterResult = { clusters: Record<string, number | undefined>; hasCluster: boolean };

/** Components and render functions do not take part in the clustering. */
const takesPart = (node: Node): boolean => node.type !== 'component' && node.id !== 'render';

/** jLouvain keeps its communities in an object; `constructor` would hit Object.prototype. */
const louvainId = (id: string): string => (id === 'constructor' ? '_constructor' : id);

/**
 * Louvain clusters of the functions in a component view: `clusters[node.id]` is the cluster
 * number or undefined. `hasCluster` is computed per call (ADR-011 A4; the legacy app never reset
 * it, quirk V3). Without any link jLouvain finds nothing, and there are no clusters.
 */
export const computeClusters = (
    nodes: readonly Node[],
    links: readonly { source: Node; target: Node }[]
): ClusterResult => {
    const louvainNodes = nodes
        .map(node => (takesPart(node) ? louvainId(node.id) : undefined))
        .filter((id): id is string => !!id);
    const louvainEdges = links
        .filter(link => takesPart(link.source) && takesPart(link.target))
        .map(link => ({ source: louvainId(link.source.id), target: louvainId(link.target.id) }));

    const communities = jLouvain().nodes(louvainNodes).edges(louvainEdges)();
    if (!communities) {
        return { clusters: {}, hasCluster: false };
    }

    // biome-ignore lint/suspicious/noConsole: legacy log, kept for debugging (user, 09.11.2026)
    console.log('Cluster:', communities);
    return {
        // Object.fromEntries defines own properties, so ids like `__proto__` stay plain keys.
        clusters: Object.fromEntries(nodes.map(node => [node.id, communities[louvainId(node.id)]])),
        hasCluster: Object.values(communities).some(cluster => cluster > 0),
    };
};
