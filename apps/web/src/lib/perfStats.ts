/**
 * Durations and counts of the work that matters for performance (layout ticks, frames, renders),
 * for the console helper `qualivis.info()` (useDebugConsole). Recording costs one
 * `performance.now()` and an array push, so it stays on in production builds.
 */

/** Keeps the last values of a series for the percentiles; count, total and max cover all. */
const keptValues = 5000;

type Series = { values: number[]; count: number; total: number; max: number };

export type SeriesSummary = {
    count: number;
    totalMs: number;
    meanMs: number;
    p50Ms: number;
    p95Ms: number;
    maxMs: number;
};

export type PerfSnapshot = {
    durations: Record<string, SeriesSummary>;
    counts: Record<string, number>;
};

const series = new Map<string, Series>();
const counts = new Map<string, number>();

const round = (ms: number) => Math.round(ms * 100) / 100;

/** Adds one duration in milliseconds to the series `name`. */
export const recordDuration = (name: string, ms: number): void => {
    let entry = series.get(name);
    if (!entry) {
        entry = { values: [], count: 0, total: 0, max: 0 };
        series.set(name, entry);
    }
    entry.count += 1;
    entry.total += ms;
    entry.max = Math.max(entry.max, ms);
    entry.values.push(ms);
    if (entry.values.length > keptValues) {
        entry.values.shift();
    }
};

/** Runs `work` and adds its duration to the series `name`. */
export const timed = <T>(name: string, work: () => T): T => {
    const start = performance.now();
    try {
        return work();
    } finally {
        recordDuration(name, performance.now() - start);
    }
};

/** Counts one event, e.g. a render of a component. */
export const countEvent = (name: string): void => {
    counts.set(name, (counts.get(name) ?? 0) + 1);
};

const percentile = (sorted: readonly number[], share: number): number =>
    sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * share))] ?? 0;

const summarize = ({ values, count, total, max }: Series): SeriesSummary => {
    const sorted = [...values].sort((a, b) => a - b);
    return {
        count,
        totalMs: round(total),
        meanMs: round(count > 0 ? total / count : 0),
        p50Ms: round(percentile(sorted, 0.5)),
        p95Ms: round(percentile(sorted, 0.95)),
        maxMs: round(max),
    };
};

/** Everything recorded since the start or the last reset, sorted by name. */
export const perfSnapshot = (): PerfSnapshot => ({
    durations: Object.fromEntries(
        [...series.entries()]
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([name, entry]) => [name, summarize(entry)])
    ),
    counts: Object.fromEntries([...counts.entries()].sort(([a], [b]) => a.localeCompare(b))),
});

export const resetPerfStats = (): void => {
    series.clear();
    counts.clear();
};
