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

/** Sum and number of the coordinates of the nodes that are free to move along the axis. */
const freeSum = (nodes: readonly LayoutNode[], axis: 'x' | 'y') => {
    const fixed = axis === 'x' ? 'fx' : 'fy';
    let sum = 0;
    let count = 0;
    for (const node of nodes) {
        if (node[fixed] == null) {
            sum += node[axis] ?? 0;
            count++;
        }
    }
    return { sum, count };
};

/** Moves all free nodes back by what `rules` moved them on average along the axis. */
const keepCentre = (nodes: readonly LayoutNode[], axis: 'x' | 'y', rules: () => void) => {
    const before = freeSum(nodes, axis);
    rules();
    const after = freeSum(nodes, axis);
    if (after.count === 0 || after.sum === before.sum) {
        return;
    }
    const shift = (after.sum - before.sum) / after.count;
    const fixed = axis === 'x' ? 'fx' : 'fy';
    for (const node of nodes) {
        if (node[fixed] == null) {
            node[axis] = (node[axis] ?? 0) - shift;
        }
    }
};

/**
 * The rules of the setting "Vertical flow layout", applied to the positions after every tick:
 * every link points down by at least `gap`, and the React methods keep their order from left to
 * right (core `reactConstraints`). Like WebCola's flowLayout, links inside a cycle are left out.
 * The rules hold exactly after every call; dragged nodes (fx, fy) stay where they are.
 *
 * The rules do not move the graph as a whole: the last pass only pushes targets down (and methods
 * to the right), which the forces undo in every tick while the layout is hot. Without the
 * correction the whole graph sank while it was laid out or a node was dragged, and came back up
 * when it cooled down.
 */
export const createFlowRules = (
    nodes: readonly LayoutNode[],
    links: readonly LayoutLink[],
    constraints: readonly ReactConstraint[],
    gap: number
): (() => void) => {
    const flow = flowLinks(nodes, links);

    // In the order of the links, one pass that pushes the targets only settles all. Before it, the
    // nodes above a dragged node move up, last link first: a dragged target cannot be pushed down.
    const pushTargetsDown = () => {
        const held = new Set<LayoutNode>();
        for (let index = flow.length - 1; index >= 0; index--) {
            const link = flow[index] as LayoutLink;
            if (link.target.fy != null || held.has(link.target)) {
                held.add(link.source);
                pushUp(link, gap);
            }
        }
        for (const link of flow) {
            pushDown(link, gap);
        }
    };
    const pushMethodsRight = () => {
        for (const { left, right, gap: xGap } of constraints) {
            pushRight(nodes[left], nodes[right], xGap);
        }
    };

    return () => {
        if (flow.length > 0) {
            keepCentre(nodes, 'y', () => {
                for (let pass = 0; pass < symmetricPasses; pass++) {
                    for (const link of flow) {
                        spreadLink(link, gap);
                    }
                }
                pushTargetsDown();
            });
            // Again: next to a dragged node, and by rounding, moving back can break a rule.
            pushTargetsDown();
        }
        if (constraints.length > 0) {
            keepCentre(nodes, 'x', pushMethodsRight);
            pushMethodsRight();
        }
    };
};

/**
 * Ends the movement of two nodes towards each other along the axis, where a rule has just moved
 * them apart: both go on at their common speed (a fixed node stands still). Taking the speed from
 * one of them only, e.g. from the target that was pushed down, would leave the other one its push:
 * in sum the whole graph gained speed downwards in every tick and fell while the layout was hot.
 */
const stopClosing = (before: LayoutNode, after: LayoutNode, axis: 'x' | 'y') => {
    const speed = axis === 'x' ? 'vx' : 'vy';
    const fixed = axis === 'x' ? 'fx' : 'fy';
    const beforeSpeed = before[fixed] == null ? (before[speed] ?? 0) : 0;
    const afterSpeed = after[fixed] == null ? (after[speed] ?? 0) : 0;
    if (beforeSpeed <= afterSpeed) {
        return;
    }
    const bothFree = before[fixed] == null && after[fixed] == null;
    const common = bothFree ? (beforeSpeed + afterSpeed) / 2 : 0;
    if (before[fixed] == null) {
        before[speed] = common;
    }
    if (after[fixed] == null) {
        after[speed] = common;
    }
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
    stopClosing(source, target, 'y');
};

/** Moves the target of a link that points down by less than `gap` down. */
const pushDown = ({ source, target }: LayoutLink, gap: number) => {
    const minY = (source.y ?? 0) + gap;
    if ((target.y ?? 0) < minY && target.fy == null) {
        target.y = minY;
        stopClosing(source, target, 'y');
    }
};

/** Moves the source of a link that points down by less than `gap` up. */
const pushUp = ({ source, target }: LayoutLink, gap: number) => {
    const maxY = (target.y ?? 0) - gap;
    if ((source.y ?? 0) > maxY && source.fy == null) {
        source.y = maxY;
        stopClosing(source, target, 'y');
    }
};

const pushRight = (left: LayoutNode | undefined, right: LayoutNode | undefined, gap: number) => {
    if (left && right && (right.x ?? 0) < (left.x ?? 0) + gap && right.fx == null) {
        right.x = (left.x ?? 0) + gap;
        stopClosing(left, right, 'x');
    }
};
