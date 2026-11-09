import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { readGolden } from '../../test/golden/loadFixture';
import type { Node } from '../model/graph';
import { computeClusters } from './cluster';

const fn = (id: string): Node => ({ id, type: 'innerFunction' });
const component: Node = { id: 'App', type: 'component' };
const link = (source: Node, target: Node) => ({ source, target });

type DomGraph = {
    hasClusterButton: boolean;
    nodes: { id: string; type: Node['type']; cluster: number | null }[];
    links: { source: string; target: string }[];
};

describe('computeClusters', () => {
    // The legacy app logs every result; keep the test output clean.
    beforeEach(() => {
        vi.spyOn(console, 'log').mockImplementation(() => {});
    });
    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('puts two separate pairs into two clusters', () => {
        const [a, b, c, d] = ['a', 'b', 'c', 'd'].map(fn) as [Node, Node, Node, Node];
        const { clusters, hasCluster } = computeClusters([a, b, c, d], [link(a, b), link(c, d)]);

        expect(clusters.a).toBe(clusters.b);
        expect(clusters.c).toBe(clusters.d);
        expect(clusters.a).not.toBe(clusters.c);
        expect(hasCluster).toBe(true);
        expect(console.log).toHaveBeenCalledWith('Cluster:', { a: 0, b: 0, c: 1, d: 1 });
    });

    it('gives components and render functions no cluster', () => {
        const render = fn('render');
        const [a, b] = [fn('a'), fn('b')];
        const { clusters } = computeClusters(
            [component, render, a, b],
            [link(component, a), link(render, b), link(a, b)]
        );

        expect(clusters.App).toBeUndefined();
        expect(clusters.render).toBeUndefined();
        expect(clusters.a).toEqual(expect.any(Number));
        expect(clusters.b).toEqual(expect.any(Number));
    });

    it('maps constructor through _constructor and back', () => {
        const ctor = fn('constructor');
        const helper = fn('helper');
        const { clusters } = computeClusters([ctor, helper], [link(ctor, helper)]);

        // A number, not Object.prototype.constructor
        expect(clusters.constructor).toEqual(expect.any(Number));
        expect(clusters).not.toHaveProperty('_constructor');
    });

    it('finds no clusters without links', () => {
        expect(computeClusters([fn('a'), fn('b')], [])).toEqual({
            clusters: {},
            hasCluster: false,
        });
    });

    it('gives the same result for the same input', () => {
        const nodes = ['a', 'b', 'c', 'd', 'e'].map(fn) as [Node, Node, Node, Node, Node];
        const links = [
            link(nodes[0], nodes[1]),
            link(nodes[1], nodes[2]),
            link(nodes[3], nodes[4]),
        ];
        expect(computeClusters(nodes, links)).toEqual(computeClusters(nodes, links));
    });

    it('matches the legacy clusters of the component view of App (mini)', () => {
        const dom = readGolden('mini', 'legacy-dom-component-mini_src_App_js_App.json') as DomGraph;
        const nodes: Node[] = dom.nodes.map(({ id, type }) => ({ id, type }));
        const byId = new Map(nodes.map(node => [node.id, node]));
        const links = dom.links.map(({ source, target }) => {
            const from = byId.get(source);
            const to = byId.get(target);
            if (!from || !to) throw new Error(`link ${source} → ${target} not in the golden nodes`);
            return link(from, to);
        });

        const { clusters, hasCluster } = computeClusters(nodes, links);

        for (const node of dom.nodes) {
            expect(clusters[node.id], node.id).toBe(node.cluster ?? undefined);
        }
        expect(hasCluster).toBe(dom.hasClusterButton);
    });
});
