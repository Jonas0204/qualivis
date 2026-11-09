import { analyzeProject } from '@qualivis/core';
import { describe, expect, it } from 'vitest';
import { loadFixture } from '../../test/fixtures';
import { selectViewGraph } from './selectViewGraph';

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

describe('selectViewGraph', () => {
    it('returns the app graph of the mini fixture in app view', () => {
        const selected = selectViewGraph(mini, undefined);

        expect(selected?.view).toBe('app');
        expect(selected?.graph).toBe(mini.appGraph);
        expect(selected?.graph.nodes).toHaveLength(8);
    });

    it('returns the graph of the component the id names', () => {
        const selected = selectViewGraph(mini, '/mini/src/App.js#App');

        expect(selected?.view).toBe('component');
        expect(selected?.graph).toBe(mini.fileMap['/mini/src/App.js']?.components?.App?.graph);
    });

    it('shows the graph of the only component instead of the empty app graph', () => {
        const selected = selectViewGraph(singleComponent, undefined);
        const component = singleComponent.fileMap['/app/src/App.js']?.components?.App;

        expect(singleComponent.appGraph.nodes).toEqual([]);
        expect(selected?.view).toBe('component');
        expect(selected?.graph).toBe(component?.graph);
        expect(selected?.graph.nodes.length).toBeGreaterThan(0);
    });

    it('shows the app graph in app view for an unknown component id', () => {
        for (const componentId of [
            '/mini/src/Nope.js#App',
            '/mini/src/App.js#Nope',
            '/mini/src/App.js',
            '/mini/src/App.js#constructor',
        ]) {
            const selected = selectViewGraph(mini, componentId);

            expect(selected?.graph).toBe(mini.appGraph);
            expect(selected?.view).toBe('app');
        }
    });
});
