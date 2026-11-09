import { nestedStringAccess } from '../legacy/nestedStringAccess';
import type { Node } from '../model/graph';
import { qualityMetrics } from '../model/qualityMetrics';
import type { MetricReport } from '../model/report';

/**
 * Threshold of a quality metric for a node. Legacy lookup (graph.component.ts:290-294, 376-380):
 * `${type}.${label || id}` first (checked with !== undefined), then `${type}`.
 */
export const resolveThreshold = (
    metricId: string,
    node: Pick<Node, 'type' | 'label' | 'id'>
): number | undefined => {
    const { thresholds } = qualityMetrics[metricId];
    const custom = thresholds[`${node.type}.${node.label || node.id}`];
    return custom !== undefined ? custom : thresholds[`${node.type}`];
};

/**
 * Value of a metric such as `sloc.physical` in a report. Like the legacy `nestedStringAccess`, it
 * throws when an intermediate object is missing.
 */
export const metricValue = (report: MetricReport, metricId: string): number =>
    nestedStringAccess(report, metricId) as unknown as number;
