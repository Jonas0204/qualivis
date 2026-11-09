import { describe, expect, it } from 'vitest';
import { metricValue, resolveThreshold } from './thresholds';

describe('resolveThreshold', () => {
    it('uses the custom threshold for the render function', () => {
        expect(resolveThreshold('sloc.physical', { type: 'innerFunction', id: 'render' })).toBe(60);
    });

    it('falls back to the threshold of the node type', () => {
        expect(resolveThreshold('sloc.physical', { type: 'innerFunction', id: 'foo' })).toBe(40);
        expect(
            resolveThreshold('sloc.physical', { type: 'component', id: 'App', label: 'render' })
        ).toBe(200);
    });

    it('looks up the label before the id', () => {
        const node = { type: 'innerFunction', id: 'foo', label: 'render' } as const;
        expect(resolveThreshold('sloc.physical', node)).toBe(60);
    });

    it('returns undefined when the metric has no threshold for the node type', () => {
        expect(resolveThreshold('sloc.jsx', { type: 'innerFunction', id: 'x' })).toBeUndefined();
    });
});

describe('metricValue', () => {
    const report = {
        cyclomatic: 3,
        paramCount: 0,
        sloc: { physical: 12, logical: 4 },
        halstead: { difficulty: 2, bugs: 0.05 },
    };

    it('reads nested metrics', () => {
        expect(metricValue(report, 'sloc.physical')).toBe(12);
        expect(metricValue(report, 'cyclomatic')).toBe(3);
    });

    it('throws like the legacy code when an intermediate object is missing', () => {
        expect(() => metricValue(report, 'foo.bar')).toThrow(TypeError);
    });
});
