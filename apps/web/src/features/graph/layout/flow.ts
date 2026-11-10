import type { ReactConstraint } from '@qualivis/core';
import type { LayoutLink, LayoutNode } from './types';

type Vertex = {
    node: LayoutNode;
    targets: Vertex[];
    visitIndex: number;
    lowLink: number;
    component: number;
};

/** Passes that move both ends of a link apart; they keep the graph compact. */
const symmetricPasses = 3;

/**
 * Numbers the strongly connected components (cycles) of the graph with Tarjan's algorithm. A
 * component gets its number after all components it links to, so a link between two components
 * always goes from a higher number to a lower one.
 */
const numberComponents = (vertices: Iterable<Vertex>): void => {
    const stack: Vertex[] = [];
    let visited = 0;
    let components = 0;
    /** Takes `v` and the vertices above it off the stack: they form one component. */
    const closeComponent = (v: Vertex) => {
        let w: Vertex | undefined;
        do {
            w = stack.pop();
            if (w) {
                w.component = components;
            }
        } while (w && w !== v);
        components++;
    };
    // Recursive: the depth is the longest path of the graph, far below the stack limit.
    const visit = (v: Vertex) => {
        v.visitIndex = v.lowLink = visited++;
        stack.push(v);
        for (const w of v.targets) {
            if (w.visitIndex < 0) {
                visit(w);
                v.lowLink = Math.min(v.lowLink, w.lowLink);
            } else if (w.component < 0) {
                v.lowLink = Math.min(v.lowLink, w.visitIndex);
            }
        }
        if (v.lowLink === v.visitIndex) {
            closeComponent(v);
        }
    };
    for (const v of vertices) {
        if (v.visitIndex < 0) {
            visit(v);
        }
    }
};

/** Links between different components, sources first, so one pass in this order settles all. */
const flowLinks = (nodes: readonly LayoutNode[], links: readonly LayoutLink[]): LayoutLink[] => {
    const vertices = new Map<LayoutNode, Vertex>(
        nodes.map(node => [node, { node, targets: [], visitIndex: -1, lowLink: 0, component: -1 }])
    );
    const vertexLinks = links.flatMap(link => {
        const source = vertices.get(link.source);
        const target = vertices.get(link.target);
        if (!source || !target) {
            return [];
        }
        source.targets.push(target);
        return [{ source, target }];
    });
    numberComponents(vertices.values());
    return vertexLinks
        .filter(({ source, target }) => source.component !== target.component)
        .sort((a, b) => b.source.component - a.source.component)
        .map(({ source, target }) => ({ source: source.node, target: target.node }));
};

/**
 * The rules of the setting "Vertical flow layout", applied to the positions after every tick:
 * every link points down by at least `gap`, and the React methods keep their order from left to
 * right (core `reactConstraints`). Like WebCola's flowLayout, links inside a cycle are left out.
 * The rules hold exactly after every call; dragged nodes (fx, fy) stay where they are.
 */
export const createFlowRules = (
    nodes: readonly LayoutNode[],
    links: readonly LayoutLink[],
    constraints: readonly ReactConstraint[],
    gap: number
): (() => void) => {
    const flow = flowLinks(nodes, links);

    return () => {
        for (let pass = 0; pass < symmetricPasses; pass++) {
            for (const link of flow) {
                spreadLink(link, gap);
            }
        }
        // The last pass pushes the targets only: in the order of the links, that settles all.
        for (const { source, target } of flow) {
            pushDown(target, (source.y ?? 0) + gap);
        }
        for (const { left, right, gap: xGap } of constraints) {
            pushRight(nodes[right], (nodes[left]?.x ?? 0) + xGap);
        }
    };
};

/** Moves both ends of a link that points down by less than `gap` apart, by half the shortfall each. */
const spreadLink = ({ source, target }: LayoutLink, gap: number) => {
    const half = ((source.y ?? 0) + gap - (target.y ?? 0)) / 2;
    if (half <= 0) {
        return;
    }
    if (source.fy == null) {
        source.y = (source.y ?? 0) - half;
    }
    if (target.fy == null) {
        target.y = (target.y ?? 0) + half;
    }
};

const pushDown = (node: LayoutNode, minY: number) => {
    if ((node.y ?? 0) < minY && node.fy == null) {
        node.y = minY;
        node.vy = 0;
    }
};

const pushRight = (node: LayoutNode | undefined, minX: number) => {
    if (node && (node.x ?? 0) < minX && node.fx == null) {
        node.x = minX;
        node.vx = 0;
    }
};
