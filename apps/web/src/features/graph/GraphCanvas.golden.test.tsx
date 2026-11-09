// The SVG markup of every node and link against the DOM of the legacy graph (testdata/golden,
// format: snapshot() in tools/legacy/capture.browser.js). Positions come from the golden, because
// only the markup is compared here; colours and layout need the visual comparison (P05-S12).
import {
    type AnalysisResult,
    analyzeProject,
    buildViewModel,
    defaultSettings,
    graphSettings,
    type View,
} from '@qualivis/core';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { goldenFiles, loadFixture, readGolden } from '../../test/fixtures';
import { renderWithState } from '../../test/renderWithState';
import { GraphCanvas } from './GraphCanvas';
import { selectViewGraph } from './selectViewGraph';

type DomNode = {
    id: string;
    x: number;
    y: number;
    dom: {
        mainR: number;
        mainClass: string;
        overlayClass: string;
        overlayFill: string;
        overlayStrokeWidth: string;
        innerR: number | null;
        innerClass: string | null;
        label: string | null;
        iconTexts: string[];
        previews: { cls: string; title: string; hidden: boolean; cx: number; cy: number }[];
        dots: { x: number; y: number }[];
    };
};

type DomSnapshot = {
    view: View;
    url: string;
    nodes: DomNode[];
    links: { source: string; target: string; dash: string | null }[];
};

const fixtures = ['mini', 'realworld'] as const;
const tolerance = 1e-9;

const expectClose = (actual: unknown, expected: number, message: string): void => {
    expect(
        Math.abs(Number(actual) - expected),
        `${message}: ${actual} vs. ${expected}`
    ).toBeLessThanOrEqual(tolerance);
};

const componentIdOf = (url: string): string | undefined => {
    const match = /[?&]id=([^&]+)/.exec(url);
    return match?.[1] ? decodeURIComponent(match[1]) : undefined;
};

const drawLikeLegacy = (result: AnalysisResult, snapshot: DomSnapshot) => {
    const viewGraph = selectViewGraph(result, componentIdOf(snapshot.url));
    if (!viewGraph) {
        throw new Error(`no graph for ${snapshot.url}`);
    }
    const model = buildViewModel(viewGraph.graph, {
        view: viewGraph.view,
        sizeMetric: graphSettings.defaultSizeMetric,
        nodeSizesBasedOnMetrics: defaultSettings.nodeSizesBasedOnMetrics ?? true,
    });
    model.nodes.forEach((node, i) => {
        node.x = snapshot.nodes[i]?.x;
        node.y = snapshot.nodes[i]?.y;
    });

    const { container } = renderWithState(
        <GraphCanvas
            nodes={model.nodes}
            links={model.links}
            view={viewGraph.view}
            settings={defaultSettings}
        />
    );
    return { container, view: viewGraph.view };
};

const expectNodeMarkup = (group: Element, legacy: DomNode, hatchUrl: string, at: string): void => {
    const main = group.querySelector('circle.circle-node');
    const overlay = group.querySelector('circle.circle-overlay');
    const inner = group.querySelector('circle.inner-circle');

    expectClose(main?.getAttribute('r'), legacy.dom.mainR, `${at} main r`);
    expect(main?.getAttribute('class'), `${at} main class`).toBe(legacy.dom.mainClass);
    expect(overlay?.getAttribute('class'), `${at} overlay class`).toBe(legacy.dom.overlayClass);
    expect(
        overlay?.getAttribute('fill')?.replace(hatchUrl, 'url(#diagonalHatch)'),
        `${at} overlay fill`
    ).toBe(legacy.dom.overlayFill);
    expect(overlay?.getAttribute('stroke-width'), `${at} overlay stroke width`).toBe(
        legacy.dom.overlayStrokeWidth
    );
    expect(inner?.getAttribute('class') ?? null, `${at} inner class`).toBe(legacy.dom.innerClass);
    if (legacy.dom.innerR !== null) {
        expectClose(inner?.getAttribute('r'), legacy.dom.innerR, `${at} inner r`);
    }
    expect(group.querySelector('tspan.label-text')?.textContent ?? null, `${at} label`).toBe(
        legacy.dom.label
    );
    expect(
        Array.from(
            group.querySelectorAll('tspan.icon'),
            icon => `${icon.getAttribute('class')}:${icon.textContent}`
        ),
        `${at} icons`
    ).toEqual(legacy.dom.iconTexts);

    const previews = Array.from(group.querySelectorAll<SVGElement>('circle.function'));
    expect(
        previews.map(circle => ({
            cls: circle.getAttribute('class'),
            title: circle.querySelector('title')?.textContent,
            hidden: circle.style.display === 'none',
        })),
        `${at} preview circles`
    ).toEqual(legacy.dom.previews.map(({ cls, title, hidden }) => ({ cls, title, hidden })));
    previews.forEach((circle, i) => {
        expectClose(
            circle.getAttribute('cx'),
            legacy.dom.previews[i]?.cx ?? Number.NaN,
            `${at} preview ${i} cx`
        );
        expectClose(
            circle.getAttribute('cy'),
            legacy.dom.previews[i]?.cy ?? Number.NaN,
            `${at} preview ${i} cy`
        );
    });

    const dots = Array.from(group.querySelectorAll('text.dots'));
    expect(dots, `${at} "..."`).toHaveLength(legacy.dom.dots.length);
    dots.forEach((text, i) => {
        expectClose(text.getAttribute('x'), legacy.dom.dots[i]?.x ?? Number.NaN, `${at} "..." x`);
        expectClose(text.getAttribute('y'), legacy.dom.dots[i]?.y ?? Number.NaN, `${at} "..." y`);
    });
};

const expectMarkup = (result: AnalysisResult, fixture: string, file: string): void => {
    const snapshot = readGolden(fixture, file) as DomSnapshot;
    const { container, view } = drawLikeLegacy(result, snapshot);
    const label = `${fixture} ${file}`;
    expect(view, `${label} view`).toBe(snapshot.view);

    const hatchUrl = `url(#${container.querySelector('pattern')?.id})`;
    const groups = Array.from(container.querySelectorAll('g.node'));
    expect(groups, `${label} nodes`).toHaveLength(snapshot.nodes.length);
    snapshot.nodes.forEach((legacy, i) => {
        const group = groups[i];
        if (group) {
            expectNodeMarkup(group, legacy, hatchUrl, `${label} ${legacy.id}`);
        }
    });

    const lines = Array.from(container.querySelectorAll('g.links line'));
    expect(
        lines.map(line => line.getAttribute('stroke-dasharray')),
        `${label} links`
    ).toEqual(snapshot.links.map(link => link.dash));
};

describe.each(fixtures)('graph markup like the legacy DOM: %s', fixture => {
    // The legacy rules log clusters and nodes without a report (K5); keep the test output clean.
    const result = analyzeProject(loadFixture(fixture));

    beforeAll(() => {
        vi.spyOn(console, 'log').mockImplementation(() => {});
        vi.spyOn(console, 'error').mockImplementation(() => {});
    });
    afterAll(() => {
        vi.restoreAllMocks();
    });

    it('draws the app view', () => {
        expectMarkup(result, fixture, 'legacy-dom-app.json');
    });

    it.each(goldenFiles(fixture, 'legacy-dom-component-'))('draws the component view %s', file => {
        expectMarkup(result, fixture, file);
    });
});
