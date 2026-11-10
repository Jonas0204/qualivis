import { afterEach, describe, expect, it, vi } from 'vitest';
import { countEvent, perfSnapshot, recordDuration, resetPerfStats, timed } from './perfStats';

describe('perfStats', () => {
    afterEach(() => {
        resetPerfStats();
        vi.restoreAllMocks();
    });

    it('sums up durations with mean, percentiles and max', () => {
        for (const ms of [4, 1, 3, 2, 10]) {
            recordDuration('tick', ms);
        }

        expect(perfSnapshot().durations).toEqual({
            tick: { count: 5, totalMs: 20, meanMs: 4, p50Ms: 3, p95Ms: 10, maxMs: 10 },
        });
    });

    it('times work, also when it throws, and counts events', () => {
        vi.spyOn(performance, 'now').mockReturnValueOnce(1).mockReturnValueOnce(3.5);
        expect(timed('work', () => 'done')).toBe('done');
        expect(() =>
            timed('fail', () => {
                throw new Error('x');
            })
        ).toThrow('x');
        countEvent('render');
        countEvent('render');

        const snapshot = perfSnapshot();
        expect(snapshot.durations.work?.totalMs).toBe(2.5);
        expect(snapshot.durations.fail?.count).toBe(1);
        expect(snapshot.counts).toEqual({ render: 2 });
    });

    it('starts again after a reset', () => {
        recordDuration('tick', 1);
        countEvent('render');

        resetPerfStats();

        expect(perfSnapshot()).toEqual({ durations: {}, counts: {} });
    });
});
