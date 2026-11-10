// Golden master G2: the visual rules of the new core must give the values of the legacy graph.
// Reference data: testdata/golden/<fixture>/legacy-dom-*.json (D3 data and DOM of the legacy
// build, format: snapshot() in tools/legacy/capture.browser.js).
import { readdirSync } from 'node:fs';
import { join } from 'node:path';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import {
    analyzeProject,
    buildViewModel,
    defaultSettings,
    describeIconText,
    type Graph,
    graphSettings,
    previewCircles,
    previewDots,
    type View,
    type ViewModel,
    type VisualNode,
} from '../../src/index';
import { loadFixture, readGolden, repoRoot } from './loadFixture';

type DomNode = {
    id: string;
    width: number;
    height: number;
    warn: boolean;
    error: boolean;
    cluster: number | null;
    icons: { icon: string; class: string; description: string }[];
    dom: {
        previews: { cls: string; title: string; hidden: boolean; cx: number; cy: number }[];
        dots: { x: number; y: number }[];
    };
};

type DomSnapshot = {
    view: View;
    url: string;
    hasClusterButton: boolean;
    nodes: DomNode[];
    links: { source: string; target: string; inherits: boolean }[];
};

/** Number of component views per fixture (testdata/golden/README.md). */
const componentViews = { mini: 4, realworld: 20 } as const;
const fixtures = Object.keys(componentViews) as (keyof typeof componentViews)[];

/** Width and positions may differ by float rounding only. */
const tolerance = 1e-9;

const expectClose = (actual: number, expected: number, message: string): void => {
    expect(
        Math.abs(actual - expected),
        `${message}: ${actual} vs. ${expected}`
    ).toBeLessThanOrEqual(tolerance);
};

/** The legacy icon texts are HTML: remove the tags and collapse the white space. */
const normalizeIconText = (html: string): string =>
    html
        .replace(/<[^>]*>/g, '')
        .replace(/\s+/g, ' ')
        .trim();

/** The component id from the snapshot URL (`?id=%2Fmini%2Fsrc%2FApp.js%23App`). */
const componentIdOf = (snapshot: DomSnapshot): string => {
    const match = /[?&]id=([^&]+)/.exec(snapshot.url);
    if (!match?.[1]) {
        throw new Error(`No component id in ${snapshot.url}`);
    }
    return decodeURIComponent(match[1]);
};

/** Legacy defaults, the goldens were captured with them (settings: null). */
const visualOptions = (view: View) => ({
    view,
    sizeMetric: graphSettings.defaultSizeMetric,
    nodeSizesBasedOnMetrics: defaultSettings.nodeSizesBasedOnMetrics ?? true,
});

const expectNode = (node: VisualNode, legacy: DomNode, at: string): void => {
    expectClose(node.width, legacy.width, `${at} width`);
    expectClose(node.height, legacy.height, `${at} height`);
    expect(node.warn, `${at} warn`).toBe(legacy.warn);
    expect(node.error, `${at} error`).toBe(legacy.error);
    expect(node.cluster ?? null, `${at} cluster`).toBe(legacy.cluster);
    expect(
        (node.icons ?? []).map(icon => ({
            icon: icon.icon,
            class: icon.class,
            text: describeIconText(icon.description),
        })),
        `${at} icons`
    ).toEqual(
        legacy.icons.map(icon => ({
            icon: icon.icon,
            class: icon.class,
            text: normalizeIconText(icon.description),
        }))
    );
};

const expectPreviews = (node: VisualNode, legacy: DomNode, at: string): void => {
    const circles = previewCircles(node.width, node.functions ?? []);
    expect(
        circles.map(circle => ({ cls: circle.className, title: circle.id, hidden: circle.hidden })),
        `${at} preview circles`
    ).toEqual(legacy.dom.previews.map(({ cls, title, hidden }) => ({ cls, title, hidden })));
    circles.forEach((circle, i) => {
        const expected = legacy.dom.previews[i];
        if (expected) {
            expectClose(circle.cx, expected.cx, `${at} preview ${i} cx`);
            expectClose(circle.cy, expected.cy, `${at} preview ${i} cy`);
        }
    });

    const dots = previewDots(node.width, node.functions ?? []);
    const legacyDots = legacy.dom.dots[0];
    expect(dots === undefined, `${at} "..." missing`).toBe(legacyDots === undefined);
    if (dots && legacyDots) {
        expectClose(dots.x, legacyDots.x, `${at} "..." x`);
        expectClose(dots.y, legacyDots.y, `${at} "..." y`);
    }
};

const expectViewModel = (model: ViewModel, snapshot: DomSnapshot, label: string): void => {
    expect(
        model.nodes.map(node => node.id),
        `${label} nodes`
    ).toEqual(snapshot.nodes.map(node => node.id));

    snapshot.nodes.forEach((legacy, i) => {
        const node = model.nodes[i];
        if (!node) {
            throw new Error(`${label}: node ${legacy.id} missing`);
        }
        const at = `${label} ${legacy.id}`;
        expectNode(node, legacy, at);
        if (snapshot.view === 'app') {
            expectPreviews(node, legacy, at);
        }
    });

    expect(
        model.links.map(link => [link.source.id, link.target.id, !!link.inherits]),
        `${label} links`
    ).toEqual(snapshot.links.map(link => [link.source, link.target, link.inherits]));

    // Legacy quirk V3: the legacy app never reset hasCluster, so after the component view of App in
    // mini every later view showed the button without any cluster > 0. ADR-011 A4 computes it per
    // graph, so such a view expects false.
    const hasLegacyCluster = snapshot.nodes.some(node => (node.cluster ?? 0) > 0);
    expect(model.hasCluster, `${label} hasCluster`).toBe(
        snapshot.hasClusterButton && hasLegacyCluster
    );
};

describe.each(fixtures)('G2 visual rules golden master: %s', fixture => {
    // The legacy rules log clusters and nodes without a report (K5); keep the test output clean.
    beforeAll(() => {
        vi.spyOn(console, 'log').mockImplementation(() => {});
        vi.spyOn(console, 'error').mockImplementation(() => {});
    });
    afterAll(() => {
        vi.restoreAllMocks();
    });

    const result = analyzeProject(loadFixture(fixture));
    const files = readdirSync(join(repoRoot, 'testdata', 'golden', fixture))
        .filter(file => file.startsWith('legacy-dom-component-'))
        .sort();

    it('finds every component view of the fixture', () => {
        expect(files).toHaveLength(componentViews[fixture]);
    });

    it('reproduces the app view', () => {
        const snapshot = readGolden(fixture, 'legacy-dom-app.json') as DomSnapshot;
        expect(snapshot.view).toBe('app');

        const model = buildViewModel(result.appGraph, visualOptions('app'));

        expectViewModel(model, snapshot, `${fixture} app`);
    });

    it.each(files)('reproduces the component view %s', file => {
        const snapshot = readGolden(fixture, file) as DomSnapshot;
        expect(snapshot.view).toBe('component');
        const componentId = componentIdOf(snapshot);
        const [fileName = '', componentName = ''] = componentId.split('#');
        const graph: Graph | undefined =
            result.fileMap[fileName]?.components?.[componentName]?.graph;
        if (!graph) {
            throw new Error(`${fixture}: no graph for ${componentId}`);
        }

        const model = buildViewModel(graph, visualOptions('component'));

        expectViewModel(model, snapshot, `${fixture} ${componentId}`);
    });
});
