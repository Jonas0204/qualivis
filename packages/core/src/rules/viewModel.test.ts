import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Graph, Node } from '../model/graph';
import type { MetricReport } from '../model/report';
import type { VisualOptions } from './nodeVisuals';
import { buildViewModel } from './viewModel';

const report = (physical: number): MetricReport => ({
    cyclomatic: 1,
    paramCount: 0,
    maxJsxNesting: 1,
    sloc: { physical, logical: 5, jsx: 2 },
    halstead: { difficulty: 1, bugs: 0.01 },
});

const fn = (id: string): Node => ({ id, type: 'innerFunction', report: report(10) });

const componentView: VisualOptions = {
    view: 'component',
    sizeMetric: 'sloc.physical',
    nodeSizesBasedOnMetrics: true,
};
const appView: VisualOptions = { ...componentView, view: 'app' };

/** A class component with React methods and two separate pairs of helper functions. */
const componentGraph = (): Graph => ({
    nodes: [
        { id: 'App', type: 'component', kind: 'ClassComponent', report: report(100) },
        fn('render'),
        fn('constructor'),
        fn('componentDidMount'),
        fn('a'),
        fn('b'),
        fn('c'),
        fn('d'),
    ],
    links: [
        { source: 'App', target: 'render' },
        { source: 'a', target: 'b' },
        { source: 'c', target: 'd', inherits: true },
    ],
});

const appGraph = (): Graph => ({
    nodes: [
        {
            id: '/p/App.js#App',
            type: 'component',
            report: report(100),
            functions: [fn('render')],
        },
        { id: '/p/Header.js#Header', type: 'component', report: report(50) },
    ],
    links: [{ source: '/p/App.js#App', target: '/p/Header.js#Header' }],
});

const byId = <T extends { id: string }>(nodes: readonly T[], id: string): T | undefined =>
    nodes.find(node => node.id === id);

describe('buildViewModel', () => {
    // The legacy app logs the clusters and missing link ends; keep the test output clean.
    beforeEach(() => {
        vi.spyOn(console, 'log').mockImplementation(() => {});
        vi.spyOn(console, 'error').mockImplementation(() => {});
    });
    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('works on a copy and leaves the graph unchanged', () => {
        const graph = componentGraph();
        const before = JSON.stringify(graph);

        const model = buildViewModel(graph, componentView);

        expect(JSON.stringify(graph)).toBe(before);
        expect(model.nodes[0]).not.toBe(graph.nodes[0]);
        expect(model.nodes.map(node => node.id)).toEqual(graph.nodes.map(node => node.id));
    });

    it('links the node objects of the view model', () => {
        const model = buildViewModel(componentGraph(), componentView);

        expect(model.links.map(link => [link.source.id, link.target.id, link.inherits])).toEqual([
            ['App', 'render', undefined],
            ['a', 'b', undefined],
            ['c', 'd', true],
        ]);
        expect(model.links[1]?.source).toBe(byId(model.nodes, 'a'));
        expect(model.links[1]?.target).toBe(byId(model.nodes, 'b'));
    });

    it('sizes the nodes by the metric', () => {
        const model = buildViewModel(componentGraph(), componentView);
        const app = byId(model.nodes, 'App');

        // sqrt((16000 / 200) * 100 / π) for a component with 100 lines (threshold 200).
        expect(app?.width).toBeCloseTo(Math.sqrt(8000 / Math.PI), 12);
        expect(app?.height).toBe(app?.width);
        expect(app?.warn).toBe(false);
        expect(app?.error).toBe(false);
    });

    it('clusters only the functions of a component view', () => {
        const model = buildViewModel(componentGraph(), componentView);
        const cluster = (id: string) => byId(model.nodes, id)?.cluster;

        expect(cluster('App')).toBeUndefined();
        expect(cluster('render')).toBeUndefined();
        expect(cluster('constructor')).toEqual(expect.any(Number));
        expect(cluster('a')).toBe(cluster('b'));
        expect(cluster('c')).toBe(cluster('d'));
        expect(cluster('a')).not.toBe(cluster('c'));
        expect(model.hasCluster).toBe(true);
    });

    it('orders the React methods of a component view', () => {
        const model = buildViewModel(componentGraph(), componentView);

        // Indexes: render 1, constructor 2, componentDidMount 3; render comes last.
        expect(model.constraints).toEqual([
            { axis: 'x', left: 2, right: 3, gap: 100 },
            { axis: 'x', left: 3, right: 1, gap: 100 },
        ]);
    });

    it('has no clusters or constraints in the app view', () => {
        const model = buildViewModel(appGraph(), appView);
        const app = byId(model.nodes, '/p/App.js#App');

        expect(app?.width).toBeCloseTo(Math.sqrt(8000 / Math.PI) + 14, 12);
        expect(app?.functions?.map(node => node.id)).toEqual(['render']);
        expect(model.nodes.every(node => node.cluster === undefined)).toBe(true);
        expect(model.hasCluster).toBe(false);
        expect(model.constraints).toEqual([]);
        expect(console.log).not.toHaveBeenCalled();
    });

    it('leaves out a link with a missing end and logs it like the legacy app', () => {
        const graph = appGraph();
        graph.links.push(
            { source: '/p/App.js#App', target: 'missing' },
            { source: 'gone', target: '/p/Header.js#Header' }
        );

        const model = buildViewModel(graph, appView);

        expect(model.links).toHaveLength(1);
        expect(console.error).toHaveBeenCalledWith('Did not find link target in nodes:', 'missing');
        expect(console.error).toHaveBeenCalledWith('Did not find link source in nodes:', 'gone');
    });
});
