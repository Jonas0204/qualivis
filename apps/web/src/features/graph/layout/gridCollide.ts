import type { Force } from 'd3-force';
import type { LayoutNode } from './types';

/** d3 moves two nodes on the same spot apart by a tiny random amount; a fixed one keeps the layout repeatable. */
const jiggle = 1e-6;

/**
 * The collision force of d3 (forceCollide with strength 1 and one iteration) for large graphs: the
 * same rule for every pair of overlapping circles, but the pairs come from a grid instead of a
 * quadtree, which is about three times as fast (P08-S09). A cell is as wide as the largest circle,
 * so two overlapping circles always lie in the same cell or in neighbouring ones. The order of the
 * pairs differs from d3, so the positions are not the same to the last digit.
 */
export const forceGridCollide = (
    radius: (node: LayoutNode) => number
): Force<LayoutNode, never> => {
    let nodes: LayoutNode[] = [];
    let radii = new Float64Array(0);
    let cell = 1;
    /** Grid column and row of every node, and the next node in the same bucket (-1 at the end). */
    let columns = new Int32Array(0);
    let rows = new Int32Array(0);
    let next = new Int32Array(0);
    /** First node of every bucket; several cells can share one, hence the cell check below. */
    let heads = new Int32Array(0);
    let mask = 0;

    const bucket = (column: number, row: number) =>
        (Math.imul(column, 73856093) ^ Math.imul(row, 19349663)) & mask;

    const fillGrid = () => {
        heads.fill(-1);
        for (let i = 0; i < nodes.length; i++) {
            const node = nodes[i] as Required<LayoutNode>;
            const column = Math.floor((node.x + node.vx) / cell);
            const row = Math.floor((node.y + node.vy) / cell);
            const at = bucket(column, row);
            columns[i] = column;
            rows[i] = row;
            next[i] = heads[at] as number;
            heads[at] = i;
        }
    };

    /** Pushes the circles i and j apart if they overlap, the larger one less (d3 collide). */
    const collide = (i: number, j: number) => {
        const a = nodes[i] as Required<LayoutNode>;
        const b = nodes[j] as Required<LayoutNode>;
        const ri = radii[i] as number;
        const rj = radii[j] as number;
        const r = ri + rj;
        let x = a.x + a.vx - b.x - b.vx;
        let y = a.y + a.vy - b.y - b.vy;
        let l = x * x + y * y;
        if (l >= r * r) {
            return;
        }
        if (x === 0) {
            x = jiggle;
            l += x * x;
        }
        if (y === 0) {
            y = jiggle;
            l += y * y;
        }
        const distance = Math.sqrt(l);
        const push = (r - distance) / distance;
        const share = (rj * rj) / (ri * ri + rj * rj);
        x *= push;
        y *= push;
        a.vx += x * share;
        a.vy += y * share;
        b.vx -= x * (1 - share);
        b.vy -= y * (1 - share);
    };

    /** Collides node i with the nodes of one cell that come after it, so every pair once. */
    const collideWithCell = (i: number, column: number, row: number) => {
        for (let j = heads[bucket(column, row)] as number; j >= 0; j = next[j] as number) {
            // Only nodes of this cell, not of another one that shares its bucket.
            if (j > i && columns[j] === column && rows[j] === row) {
                collide(i, j);
            }
        }
    };

    const force = () => {
        fillGrid();
        for (let i = 0; i < nodes.length; i++) {
            const column = columns[i] as number;
            const row = rows[i] as number;
            for (let c = column - 1; c <= column + 1; c++) {
                for (let r = row - 1; r <= row + 1; r++) {
                    collideWithCell(i, c, r);
                }
            }
        }
    };

    force.initialize = (initial: LayoutNode[]) => {
        nodes = initial;
        radii = Float64Array.from(nodes, radius);
        cell = Math.max(1, 2 * radii.reduce((max, each) => Math.max(max, each), 0));
        columns = new Int32Array(nodes.length);
        rows = new Int32Array(nodes.length);
        next = new Int32Array(nodes.length);
        const buckets = 2 ** Math.ceil(Math.log2(Math.max(16, nodes.length * 2)));
        heads = new Int32Array(buckets);
        mask = buckets - 1;
    };

    return force;
};
