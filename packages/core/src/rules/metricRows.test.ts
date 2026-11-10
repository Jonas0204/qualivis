import { describe, expect, it } from 'vitest';
import { metricRows } from './metricRows';

const report = {
    cyclomatic: 24,
    paramCount: 2,
    sloc: { physical: 170, logical: 80, jsx: 70 },
    halstead: { difficulty: 34.286, bugs: 0.373 },
    maxJsxNesting: 3,
};

describe('metricRows', () => {
    it('gives the component rows in the order of qualityMetrics with value, threshold and level', () => {
        const rows = metricRows({ id: '/a.js#A', label: 'A', type: 'component', report });

        expect(rows.map(row => [row.id, row.value, row.threshold, row.level])).toEqual([
            // 170 / 200 = 0.85 ≥ 0.8 → warn
            ['sloc.physical', 170, 200, 'warn'],
            // 70 ≥ 65 → error
            ['sloc.jsx', 70, 65, 'error'],
            ['maxJsxNesting', 3, 8, 'ok'],
            // 24 / 30 = 0.8 → warn (the warning starts at exactly 80 %)
            ['cyclomatic', 24, 30, 'warn'],
            ['halstead.difficulty', 34.286, 50, 'ok'],
            ['halstead.bugs', 0.373, 1, 'ok'],
            ['paramCount', 2, 20, 'ok'],
        ]);
        expect(rows[0]).toMatchObject({
            name: 'Lines of Code',
            description: 'The number of lines of code including comments.',
            ratio: 0.85,
        });
        // Not capped: the bar caps it at 100 %.
        expect(rows[1]?.ratio).toBeCloseTo(70 / 65);
    });

    it('takes the aggregate report of a class component', () => {
        const rows = metricRows({
            id: '/a.js#A',
            type: 'component',
            report: { aggregate: { ...report, cyclomatic: 31 }, cyclomatic: 1 },
        });

        expect(rows.find(row => row.id === 'cyclomatic')).toMatchObject({
            value: 31,
            level: 'error',
        });
    });

    it('leaves out metrics without a threshold for the node and uses the render threshold', () => {
        const rows = metricRows({ id: 'render', type: 'innerFunction', report });

        // sloc.jsx and maxJsxNesting have thresholds for components only.
        expect(rows.map(row => row.id)).toEqual([
            'sloc.physical',
            'cyclomatic',
            'halstead.difficulty',
            'halstead.bugs',
            'paramCount',
        ]);
        // innerFunction.render: 60 lines instead of 40; 170 ≥ 60 → error
        expect(rows[0]).toMatchObject({ threshold: 60, level: 'error' });
    });

    it('has no rows without a report', () => {
        expect(metricRows({ id: '/a.js#B', type: 'component', report: undefined })).toEqual([]);
    });
});
