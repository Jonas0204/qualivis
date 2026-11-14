import { analyzeProject } from '@qualivis/core';
import { afterEach, describe, expect, it, vi } from 'vitest';
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
        vi.restoreAllMocks();
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
        expect(info?.view).toEqual({
            view: 'app',
            nodes: mini.appGraph.nodes.length,
            links: mini.appGraph.links.length,
        });
        expect(info?.perf.counts).toEqual({ 'render.GraphNode': 1 });
        // jsdom reports no long tasks.
        expect(info?.longTasks).toBe('unsupported');
    });

    it('names no file, path or component of the project, so it can be shared', () => {
        renderHookWithState(() => useDebugConsole(), { initialValues: [done] });

        const json = JSON.stringify(consoleOf()?.info());

        for (const fileName of Object.keys(mini.fileMap)) {
            expect(json).not.toContain(fileName);
        }
        for (const node of mini.appGraph.nodes) {
            expect(json).not.toContain(`"${node.id}"`);
        }
    });

    it('saves the facts as a JSON file with info().export()', async () => {
        renderHookWithState(() => useDebugConsole(), { initialValues: [done] });
        let saved: Blob | undefined;
        URL.createObjectURL = (blob: Blob) => {
            saved = blob;
            return 'blob:info';
        };
        URL.revokeObjectURL = () => undefined;
        const click = vi
            .spyOn(HTMLAnchorElement.prototype, 'click')
            .mockImplementation(() => undefined);

        const info = consoleOf()?.info();
        info?.export();

        const link = click.mock.contexts[0] as HTMLAnchorElement | undefined;
        expect(link?.download).toMatch(/^qualivis-info-.+.json$/);
        expect(JSON.parse((await saved?.text()) ?? '')).toEqual(JSON.parse(JSON.stringify(info)));
        // export() itself is no part of the facts.
        expect(Object.keys(info ?? {})).not.toContain('export');
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
