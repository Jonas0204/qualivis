// Port of GraphComponent.generateReactConstraints (legacy graph.component.ts:530-561), see
// docs/migration/01-referenz-altsystem/03-visuelle-regeln.md §9.2.
import type { Node } from '../model/graph';
import { graphSettings } from '../model/graphSettings';
import { reactMethods } from '../model/specialMethods';

/** WebCola separation constraint: node `left` stays at least `gap` left of node `right`. */
export type ReactConstraint = { axis: 'x'; left: number; right: number; gap: number };

/**
 * Orders the React methods of a component view from left to right in the order of `reactMethods`
 * (lifecycle order, render last). `left` and `right` are indexes into `nodes`.
 */
export const reactConstraints = (
    nodes: readonly Pick<Node, 'id'>[],
    gap: number = graphSettings.nodeGap
): ReactConstraint[] => {
    const nodeIndexes: number[] = [];
    for (const methodName of reactMethods) {
        const nodeIndex = nodes.findIndex(node => node.id === methodName);
        if (nodeIndex >= 0) {
            nodeIndexes.push(nodeIndex);
        }
    }

    const constraints: ReactConstraint[] = [];
    for (let i = 0; i < nodeIndexes.length; i++) {
        const nextNodeIndex = nodeIndexes[i + 1];
        // Legacy quirk V4: a next index of 0 is falsy, so that pair gets no constraint
        // (see docs/migration/01-referenz-altsystem/03-visuelle-regeln.md §9.2 and §16).
        if (!nextNodeIndex) {
            continue;
        }
        constraints.push({ axis: 'x', left: nodeIndexes[i], right: nextNodeIndex, gap });
    }
    return constraints;
};
