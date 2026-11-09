import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Node } from '../model/graph';
import type { MetricReport } from '../model/report';
import { computeNodeVisual, type VisualOptions } from './nodeVisuals';

const report = (physical: number, extra: Partial<MetricReport> = {}): MetricReport => ({
    cyclomatic: 1,
    paramCount: 0,
    maxJsxNesting: 1,
    sloc: { physical, logical: 5, jsx: 2 },
    halstead: { difficulty: 1, bugs: 0.01 },
    ...extra,
});

const component = (r: MetricReport | undefined, extra: Partial<Node> = {}): Node => ({
    id: 'App',
    type: 'component',
    kind: 'FunctionComponent',
    report: r,
    ...extra,
});

const componentView: VisualOptions = {
    view: 'component',
    sizeMetric: 'sloc.physical',
    nodeSizesBasedOnMetrics: true,
};
const appView: VisualOptions = { ...componentView, view: 'app' };

const deepFreeze = <T extends object>(value: T): T => {
    for (const child of Object.values(value)) {
        if (child && typeof child === 'object') {
            deepFreeze(child);
        }
    }
    return Object.freeze(value);
};

describe('computeNodeVisual', () => {
    // A missing report is logged; keep the test output clean.
    beforeEach(() => {
        vi.spyOn(console, 'error').mockImplementation(() => {});
    });
    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('sizes the circle area by the metric (component view)', () => {
        // sqrt((16000 / 200) * 200 / π) = sqrt(5092.96…) = 71.36…
        const visual = computeNodeVisual(component(report(200)), componentView);
        expect(visual.width).toBeCloseTo(71.365, 3);
        expect(visual.height).toBe(visual.width);
    });

    it('adds the preview width of 14 in the app view', () => {
        const inComponentView = computeNodeVisual(component(report(200)), componentView).width;
        expect(computeNodeVisual(component(report(200)), appView).width).toBeCloseTo(
            inComponentView + 14,
            12
        );
    });

    it('uses the custom threshold of the render function', () => {
        // sqrt((16000 / 60) * 60 / π): at the threshold every node has the same size
        const render: Node = { id: 'render', type: 'innerFunction', report: report(60) };
        expect(computeNodeVisual(render, componentView).width).toBeCloseTo(71.365, 3);
    });

    it('warns from 80 % of the threshold and reports an error from the threshold', () => {
        const levels = (physical: number) => {
            const { warn, error } = computeNodeVisual(component(report(physical)), componentView);
            return { warn, error };
        };
        expect(levels(159)).toEqual({ warn: false, error: false });
        expect(levels(160)).toEqual({ warn: true, error: false });
        expect(levels(199)).toEqual({ warn: true, error: false });
        expect(levels(200)).toEqual({ warn: false, error: true });
    });

    it('computes the icons of the node', () => {
        const { icons } = computeNodeVisual(component(report(200)), componentView);
        expect(icons?.map(i => `${i.icon}/${i.class}`)).toEqual(['warning/error']);
    });

    it('prefers the aggregate report of a component', () => {
        const node = component(report(10, { aggregate: report(200) }));
        expect(computeNodeVisual(node, componentView)).toMatchObject({ error: true });
    });

    it('keeps legacy quirk V2: a node without a report is 20 wide and has no icons', () => {
        expect(computeNodeVisual(component(undefined), appView)).toEqual({
            width: 20,
            height: 20,
            warn: false,
            error: false,
            icons: undefined,
        });
    });

    it('logs a missing report like the legacy app', () => {
        computeNodeVisual(component(undefined), appView);
        expect(console.error).toHaveBeenCalledWith('Report not found:', 'App');
    });

    it('gives the fixed size 48 when the size metric has no threshold for the node (ADR-011 A11)', () => {
        // sloc.jsx only has a threshold for components (legacy: size NaN)
        const fn: Node = { id: 'handleClick', type: 'innerFunction', report: report(10) };
        expect(computeNodeVisual(fn, { ...componentView, sizeMetric: 'sloc.jsx' })).toEqual({
            width: 48,
            height: 48,
            warn: false,
            error: false,
            icons: [],
        });
    });

    describe('with fixed node sizes (ADR-011 A8)', () => {
        const fixed: VisualOptions = { ...appView, nodeSizesBasedOnMetrics: false };

        it('makes every node 48 wide but still computes levels and icons', () => {
            expect(computeNodeVisual(component(report(170)), fixed)).toEqual({
                width: 48,
                height: 48,
                warn: true,
                error: false,
                icons: [
                    {
                        icon: 'warning',
                        class: 'warn',
                        description: {
                            text: 'This component almost exceeds at least one metric threshold. A solution might be to split it into smaller components.',
                        },
                    },
                ],
            });
        });

        it('keeps the size 48 for a node without a report, without icons (V2)', () => {
            expect(computeNodeVisual(component(undefined), fixed)).toEqual({
                width: 48,
                height: 48,
                warn: false,
                error: false,
                icons: undefined,
            });
        });
    });

    it('does not change the node', () => {
        const node = deepFreeze(component(report(170, { aggregate: report(170) })));
        expect(() => computeNodeVisual(node, appView)).not.toThrow();
        expect(() =>
            computeNodeVisual(node, { ...appView, nodeSizesBasedOnMetrics: false })
        ).not.toThrow();
        expect(node).not.toHaveProperty('width');
        expect(node).not.toHaveProperty('icons');
    });
});
