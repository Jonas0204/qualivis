import { type AnalysisResult, analyzeProject } from '@qualivis/core';
import { describe, expect, it, vi } from 'vitest';
import { loadFixture } from '../../test/fixtures';
import { buildViewGraph } from './buildViewGraph';

const mini = analyzeProject(loadFixture('mini'));

const singleComponent = analyzeProject([
    {
        path: '/app/src/App.js',
        code: [
            "import React from 'react';",
            'export default class App extends React.Component {',
            '  handleClick() {}',
            '  render() { return <button onClick={() => this.handleClick()} />; }',
            '}',
        ].join('\n'),
    },
]);

const ids = (nodes: readonly { id: string }[]) => nodes.map(node => node.id);

describe('buildViewGraph', () => {
    it('returns the app graph of the mini fixture with links between its own nodes', () => {
        const graph = buildViewGraph(mini, undefined);

        expect(graph?.view).toBe('app');
        expect(graph?.nodes).toHaveLength(8);
        expect(graph?.links).toHaveLength(7);
        expect(ids(graph?.nodes ?? [])).toEqual(ids(mini.appGraph.nodes));
        for (const link of graph?.links ?? []) {
            expect(graph?.nodes).toContain(link.source);
            expect(graph?.nodes).toContain(link.target);
        }
    });

    it('copies the nodes, so the layout cannot change the analysis result', () => {
        const graph = buildViewGraph(mini, undefined);
        const node = graph?.nodes[0];
        if (!node) {
            throw new Error('no node');
        }

        node.x = 10;

        expect(mini.appGraph.nodes[0]).not.toBe(node);
        expect(mini.appGraph.nodes[0]?.x).toBeUndefined();
    });

    it('gives every node the size without metrics (48 px)', () => {
        const graph = buildViewGraph(mini, undefined);

        expect(new Set(graph?.nodes.map(node => [node.width, node.height].join('x')))).toEqual(
            new Set(['48x48'])
        );
    });

    it('returns the graph of the component the id names', () => {
        const graph = buildViewGraph(mini, '/mini/src/App.js#App');

        expect(graph?.view).toBe('component');
        expect(ids(graph?.nodes ?? [])).toEqual(
            ids(mini.fileMap['/mini/src/App.js']?.components?.App?.graph?.nodes ?? [])
        );
    });

    it('shows the graph of the only component instead of the empty app graph', () => {
        const graph = buildViewGraph(singleComponent, undefined);
        const component = singleComponent.fileMap['/app/src/App.js']?.components?.App;

        expect(singleComponent.appGraph.nodes).toEqual([]);
        expect(graph?.view).toBe('component');
        expect(ids(graph?.nodes ?? [])).toEqual(ids(component?.graph?.nodes ?? []));
        expect(graph?.nodes.length).toBeGreaterThan(0);
    });

    it('shows the app graph in app view for an unknown component id', () => {
        for (const componentId of [
            '/mini/src/Nope.js#App',
            '/mini/src/App.js#Nope',
            '/mini/src/App.js',
            '/mini/src/App.js#constructor',
        ]) {
            const graph = buildViewGraph(mini, componentId);

            expect(ids(graph?.nodes ?? [])).toEqual(ids(mini.appGraph.nodes));
            expect(graph?.view).toBe('app');
        }
    });

    it('reports and leaves out links to missing nodes', () => {
        const error = vi.spyOn(console, 'error').mockImplementation(() => {});
        const result = {
            fileMap: {},
            appGraph: {
                nodes: [{ id: 'a' }, { id: 'b' }],
                links: [
                    { source: 'a', target: 'b' },
                    { source: 'a', target: 'gone' },
                ],
            },
        } as unknown as AnalysisResult;

        const graph = buildViewGraph(result, undefined);

        expect(graph?.links.map(link => [link.source.id, link.target.id])).toEqual([['a', 'b']]);
        expect(error).toHaveBeenCalledWith('Did not find link target in nodes:', 'gone');
        error.mockRestore();
    });
});
