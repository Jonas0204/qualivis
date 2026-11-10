// Golden G4: the code quality panel of every node of the app view and of every component view
// against the panels of the legacy build (testdata/golden, format: readPanel() in
// tools/legacy/capture.browser.js). The selections come from the same clicks as in the legacy app.
import {
    type AnalysisResult,
    analyzeProject,
    buildViewModel,
    graphSettings,
    type View,
} from '@qualivis/core';
import { cleanup, render } from '@testing-library/react';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { createNodeSelection } from '../../state/selection';
import { goldenFiles, loadFixture, readGolden } from '../../test/fixtures';
import { selectViewGraph } from '../graph/selectViewGraph';
import { CodeQualityContent } from './CodeQualityPanel';

type LegacyPanel = {
    header: string;
    metrics: {
        name: string;
        description: string;
        value: string;
        valueTitle: string;
        barClass: string;
    }[];
    icons: { hostClass: string; icon: string; description: string }[];
};

type PanelGolden = { id: string; panel: LegacyPanel }[];

const fixtures = ['mini', 'realworld'] as const;

const text = (element: Element | null) => element?.textContent?.replace(/\s+/g, ' ').trim() ?? null;

/** The level that the classes of the legacy progress bar stand for. */
const levelOf = (barClass: string) =>
    /\berror\b/.test(barClass) ? 'error' : /\bwarn\b/.test(barClass) ? 'warn' : 'ok';

const readPanel = (container: HTMLElement) => ({
    header: text(container.querySelector('h2')),
    metrics: Array.from(container.querySelectorAll('[data-level]'), metric => ({
        name: text(metric.querySelector('span[title]')),
        description: metric.querySelector('span[title]')?.getAttribute('title'),
        value: text(metric.querySelectorAll('span')[1] ?? null),
        valueTitle: metric.querySelectorAll('span')[1]?.getAttribute('title'),
        level: metric.getAttribute('data-level'),
    })),
    icons: Array.from(container.querySelectorAll('[data-class]'), icon => ({
        class: icon.getAttribute('data-class'),
        icon: text(icon.querySelector('[aria-hidden]')),
        description: text(icon.querySelector('[aria-hidden] + span')),
    })),
});

const expectedPanel = ({ header, metrics, icons }: LegacyPanel, hasReport: boolean) => ({
    header,
    // A node without a report shows no bars (ADR-011 A20); the legacy app kept the bars of the
    // node clicked before.
    metrics: hasReport
        ? metrics.map(({ name, description, value, valueTitle, barClass }) => ({
              name,
              description,
              value,
              valueTitle,
              level: levelOf(barClass),
          }))
        : [],
    icons: icons.map(({ hostClass, icon, description }) => ({
        class: /\berror\b/.test(hostClass) ? 'error' : 'warn',
        icon,
        description,
    })),
});

/** The component of a component view golden: from the URL of its DOM golden. */
const componentIdOf = (fixture: string, panelFile: string) => {
    const dom = readGolden(fixture, panelFile.replace('legacy-panels-', 'legacy-dom-')) as {
        url: string;
    };
    const match = /[?&]id=([^&]+)/.exec(dom.url);
    return match?.[1] ? decodeURIComponent(match[1]) : undefined;
};

const comparePanels = (
    result: AnalysisResult,
    golden: PanelGolden,
    componentId: string | undefined
) => {
    const viewGraph = selectViewGraph(result, componentId);
    if (!viewGraph) {
        throw new Error(`no graph for ${componentId}`);
    }
    const view: View = viewGraph.view;
    const { nodes } = buildViewModel(viewGraph.graph, {
        view,
        sizeMetric: graphSettings.defaultSizeMetric,
        nodeSizesBasedOnMetrics: true,
    });
    expect(golden.map(entry => entry.id).sort()).toEqual(nodes.map(node => node.id).sort());

    for (const { id, panel } of golden) {
        const node = nodes.find(each => each.id === id);
        if (!node) {
            throw new Error(`no node ${id}`);
        }
        const selection = createNodeSelection(
            result.fileMap,
            node,
            view === 'component' ? componentId : undefined
        );
        const { container } = render(<CodeQualityContent selectedNode={selection} />);
        expect(readPanel(container), `${componentId ?? 'app view'}: ${id}`).toEqual(
            expectedPanel(panel, !!node.report)
        );
        cleanup();
    }
};

describe.each(fixtures)('G4 code quality panel, fixture %s', fixture => {
    let result: AnalysisResult;

    beforeAll(() => {
        // The panel logs every report; the view model logs nodes without a report (K5).
        vi.spyOn(console, 'log').mockImplementation(() => {});
        vi.spyOn(console, 'error').mockImplementation(() => {});
        result = analyzeProject(loadFixture(fixture));
    });
    afterAll(() => {
        vi.restoreAllMocks();
    });

    it('matches the panels of all nodes of the app view', () => {
        comparePanels(
            result,
            readGolden(fixture, 'legacy-panels-app.json') as PanelGolden,
            undefined
        );
    });

    const componentFiles = goldenFiles(fixture, 'legacy-panels-component-');

    it.each(componentFiles)('matches the panels of the component view %s', file => {
        const componentId = componentIdOf(fixture, file);
        expect(componentId).toBeDefined();
        comparePanels(result, readGolden(fixture, file) as PanelGolden, componentId);
    });
});
