// Port of the fading rules of GraphComponent.createFading (legacy graph.component.ts:733-804) and of
// removeNode (1050-1056), see docs/migration/01-referenz-altsystem/03-visuelle-regeln.md §12.
import type { Graph } from '../model/graph';

/** The ends of a link; the legacy app compared the node objects, the ids are unique in a graph. */
export type LinkEnds = { source: { id: string }; target: { id: string } };

/** Ids of the nodes connected to a node, each once. */
export type Connections = { incoming: string[]; outgoing: string[]; indirect: string[] };

const unique = (ids: readonly string[]): string[] => [...new Set(ids)];

/**
 * Nodes linked to `nodeId`: sources of its incoming links, targets of its outgoing links and, with
 * `indirect`, every node reached from the outgoing ones along outgoing links (breadth-first,
 * without `nodeId` and without the outgoing nodes). The legacy lists could hold a node twice; only
 * membership counts, so here each id is listed once.
 */
export const connectedNodes = (
    nodeId: string,
    links: readonly LinkEnds[],
    { indirect }: { indirect: boolean }
): Connections => {
    const incoming = unique(
        links.filter(link => link.target.id === nodeId).map(link => link.source.id)
    );
    const outgoing = unique(
        links.filter(link => link.source.id === nodeId).map(link => link.target.id)
    );
    const indirectNodes: string[] = [];

    if (indirect) {
        const searched = new Set<string>();
        let search = outgoing;
        while (search.length > 0) {
            for (const id of search) {
                searched.add(id);
            }
            const from = new Set(search);
            search = unique(
                links.filter(link => from.has(link.source.id)).map(link => link.target.id)
            ).filter(id => id !== nodeId && !searched.has(id));
            indirectNodes.push(...search);
        }
    }

    return { incoming, outgoing, indirect: indirectNodes };
};

/**
 * Whether a link stays visible while the graph is faded to `focusId`: it touches the focus, or both
 * ends lie in the outgoing or indirect nodes of the focus.
 */
export const isLinkHighlighted = (
    link: LinkEnds,
    focusId: string,
    outgoingAndIndirect: ReadonlySet<string>
): boolean =>
    link.source.id === focusId ||
    link.target.id === focusId ||
    (outgoingAndIndirect.has(link.source.id) && outgoingAndIndirect.has(link.target.id));

/** The graph without the nodes and their links (Ctrl+click, legacy removeNode). */
export const withoutNodes = (graph: Graph, nodeIds: readonly string[]): Graph => {
    if (nodeIds.length === 0) {
        return graph;
    }
    const removed = new Set(nodeIds);
    return {
        nodes: graph.nodes.filter(node => !removed.has(node.id)),
        links: graph.links.filter(link => !removed.has(link.source) && !removed.has(link.target)),
    };
};
