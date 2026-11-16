import { nestedStringAccess } from '../legacy/nestedStringAccess';
import type { Node } from '../model/graph';
import { qualityMetrics } from '../model/qualityMetrics';
import { resolveThreshold, type ThresholdLevel, thresholdLevel } from './thresholds';

/** One bar of the code quality panel. */
export type MetricRow = {
    id: string;
    name: string;
    description?: string;
    /** The value as the report has it; `undefined` when the report lacks it. */
    value: unknown;
    threshold: number;
    /** `value / threshold`, not capped. */
    ratio: number;
    level: ThresholdLevel;
};

/**
 * The metric bars of the code quality panel for a selection (legacy code-quality and
 * quality-metric components): one row per metric with a threshold for the node, in the order of
 * `qualityMetrics`, on the aggregate report of a class component. A falsy threshold hides the row
 * (`*ngIf="threshold"`). Without a report there are no rows.
 */
export const metricRows = (
    selection: Pick<Node, 'id' | 'label' | 'type' | 'report'>
): MetricRow[] => {
    const report = selection.report?.aggregate ?? selection.report;
    if (!report) {
        return [];
    }

    return Object.keys(qualityMetrics).flatMap(id => {
        const threshold = resolveThreshold(id, selection);
        if (!threshold) {
            return [];
        }
        const value = nestedStringAccess(report, id);
        const numeric = Number(value);
        const level = thresholdLevel(numeric, threshold);
        const { name, description } = qualityMetrics[id];
        return [{ id, name, description, value, threshold, ratio: numeric / threshold, level }];
    });
};
