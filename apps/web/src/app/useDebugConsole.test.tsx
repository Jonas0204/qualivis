import { analyzeProject } from '@qualivis/core';
import { afterEach, describe, expect, it } from 'vitest';
import { countEvent, resetPerfStats } from '../lib/perfStats';
import { analysisAtom, initialAnalysisState } from '../state/analysisAtoms';
import { loadFixture } from '../test/fixtures';
import { renderHookWithState } from '../test/renderWithState';
import { initial } from '../test/TestProvider';
import { type DebugConsole, useDebugConsole } from './useDebugConsole';

const mini = analyzeProject(loadFixture('mini'));
const done = initial(analysisAtom, { ...initialAnalysisState, status: 'done', result: mini });
const consoleOf = () => (window as Window & { qualivis?: DebugConsole }).qualivis;

describe('useDebugConsole', () => {
    afterEach(() => {
        resetPerfStats();
    });

    it('puts qualivis.info() on window with the analysis, the view and the timings', () => {
        renderHookWithState(() => useDebugConsole(), { initialValues: [done] });
        countEvent('render.GraphNode');

        const info = consoleOf()?.info();

        expect(info?.analysis).toMatchObject({
            status: 'done',
            files: Object.keys(mini.fileMap).length,
            appGraph: { nodes: mini.appGraph.nodes.length, links: mini.appGraph.links.length },
        });
        expect(info?.analysis.largestComponentGraphs.length).toBeGreaterThan(0);
        expect(info?.view).toMatchObject({ view: 'app', componentId: undefined });
        expect(info?.perf.counts).toEqual({ 'render.GraphNode': 1 });
        // jsdom reports no long tasks.
        expect(info?.longTasks).toBe('unsupported');
    });

    it('clears the timings with reset() and leaves window on unmount', () => {
        const { unmount } = renderHookWithState(() => useDebugConsole());
        countEvent('render.GraphNode');

        consoleOf()?.reset();
        expect(consoleOf()?.info().perf.counts).toEqual({});

        unmount();
        expect(consoleOf()).toBeUndefined();
    });
});
