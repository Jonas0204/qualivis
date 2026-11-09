// Golden master G3 (ADR-003 makes it optional): the WebCola engine places the nodes like the legacy
// app. Reference data: x, y and `container` in testdata/golden/<fixture>/legacy-dom-*.json.
//
// The goldens hold the positions right after the synchronous start(40, 20, 20), before the first
// animation tick: no animation frame ran while they were captured (the d3 timer did not fire).
// So the test compares the positions after the first frame of the engine, which runs that start.
import {
    analyzeProject,
    buildViewModel,
    type Graph,
    graphSettings,
    type View,
} from '@qualivis/core';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { goldenFiles, loadFixture, readGolden } from '../../../test/fixtures';
import { createColaLayout } from './colaLayout';

type DomSnapshot = {
    view: View;
    url: string;
    /** Size of the graph area (clientWidth, clientHeight). */
    container: [number, number];
    nodes: { id: string; x: number; y: number }[];
};

const fixtures = ['mini', 'realworld'] as const;

/** Positions may differ by float rounding only, as in G2. */
const tolerance = 1e-9;

const componentGraph = (result: ReturnType<typeof analyzeProject>, url: string): Graph => {
    const id = decodeURIComponent(/[?&]id=([^&]+)/.exec(url)?.[1] ?? '');
    const [file = '', name = ''] = id.split('#');
    const graph = result.fileMap[file]?.components?.[name]?.graph;
    if (!graph) {
        throw new Error(`No graph for ${id}`);
    }
    return graph;
};

describe.each(fixtures)('G3 WebCola positions golden master: %s', fixture => {
    // The view model logs clusters and nodes without a report (K5); keep the test output clean.
    beforeAll(() => {
        vi.spyOn(console, 'log').mockImplementation(() => {});
        vi.spyOn(console, 'error').mockImplementation(() => {});
        vi.useFakeTimers({ toFake: ['requestAnimationFrame', 'cancelAnimationFrame'] });
    });
    afterAll(() => {
        vi.useRealTimers();
        vi.restoreAllMocks();
    });

    const result = analyzeProject(loadFixture(fixture));
    const files = ['legacy-dom-app.json', ...goldenFiles(fixture, 'legacy-dom-component-')];

    it.each(files)('places the nodes of %s', file => {
        const snapshot = readGolden(fixture, file) as DomSnapshot;
        const graph =
            snapshot.view === 'app' ? result.appGraph : componentGraph(result, snapshot.url);
        const model = buildViewModel(graph, {
            view: snapshot.view,
            sizeMetric: graphSettings.defaultSizeMetric,
            nodeSizesBasedOnMetrics: true,
        });
        const [width, height] = snapshot.container;
        const engine = createColaLayout({
            nodes: model.nodes,
            links: model.links,
            constraints: model.constraints,
            width,
            height,
        });

        engine.start();
        vi.advanceTimersToNextFrame();
        engine.stop();

        expect(model.nodes.map(node => node.id)).toEqual(snapshot.nodes.map(node => node.id));
        snapshot.nodes.forEach((legacy, i) => {
            const node = model.nodes[i];
            for (const axis of ['x', 'y'] as const) {
                const actual = node?.[axis] ?? Number.NaN;
                expect(
                    Math.abs(actual - legacy[axis]),
                    `${legacy.id} ${axis}: ${actual} vs. ${legacy[axis]}`
                ).toBeLessThanOrEqual(tolerance);
            }
        });
    });
});
