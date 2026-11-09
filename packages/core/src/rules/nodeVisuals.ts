// Port of GraphComponent.generateNodeSizes (legacy graph.component.ts:245-315), see
// docs/migration/01-referenz-altsystem/03-visuelle-regeln.md §2.
import type { Node } from '../model/graph';
import { graphSettings } from '../model/graphSettings';
import { sizeConstant, warningThreshold } from '../model/qualityMetrics';
import type { MetricReport } from '../model/report';
import { getNodeIcons, type VisualIcon } from './icons';
import { metricValue, resolveThreshold } from './thresholds';

/** App view (`app`) or component view (`component`), see visual rules §1. */
export type View = 'app' | 'component';

export type VisualOptions = { view: View; sizeMetric: string; nodeSizesBasedOnMetrics: boolean };

export type NodeVisual = {
    width: number;
    height: number;
    warn: boolean;
    error: boolean;
    icons: VisualIcon[] | undefined;
};

/** Size when node sizes are not based on metrics (2 × circleRadius = 48). */
const fixedSize = graphSettings.circleRadius * 2;

/** Room for the preview circles of app view nodes (legacy getCirclePreviewWidth, = 14). */
const previewWidth = (graphSettings.previewCircleRadius + graphSettings.circleStrokeWidth / 2) * 4;

/**
 * Size, warning level and icons of a graph node; the node itself stays unchanged.
 * Port of GraphComponent.generateNodeSizes (quirk V2 preserved; V1 corrected by ADR-011 A8, the
 * size for a metric without threshold by A11).
 */
export const computeNodeVisual = (node: Node, options: VisualOptions): NodeVisual => {
    const report: MetricReport | undefined = node.report?.aggregate || node.report;

    if (!report) {
        // biome-ignore lint/suspicious/noConsole: legacy log, kept for debugging (user, 09.11.2026)
        console.error('Report not found:', node.id);
        // Legacy quirk V2: without a report the node is 20 wide and keeps its own fields, which are
        // undefined on a fresh node copy, so it gets no icons
        // (see docs/migration/01-referenz-altsystem/03-visuelle-regeln.md §2 and §16).
        // With fixed sizes the legacy app returned 48 before it looked at the report; A8 keeps that.
        const size = options.nodeSizesBasedOnMetrics ? 20 : fixedSize;
        return {
            width: size,
            height: size,
            warn: !!node.warn,
            error: !!node.error,
            icons: undefined,
        };
    }

    const icons = getNodeIcons(node, report, options.view);
    const threshold = resolveThreshold(options.sizeMetric, node);

    if (threshold === undefined) {
        // ADR-011 A11: a component-only size metric has no threshold for functions. The legacy size was
        // NaN; here the node gets the fixed size and no warning level.
        return { width: fixedSize, height: fixedSize, warn: false, error: false, icons };
    }

    const value = metricValue(report, options.sizeMetric);
    const warn = value >= threshold * warningThreshold && value < threshold;
    const error = !warn && value >= threshold;

    if (!options.nodeSizesBasedOnMetrics) {
        // ADR-011 A8 corrects legacy quirk V1: the size is fixed, icons and levels are computed anyway.
        return { width: fixedSize, height: fixedSize, warn, error, icons };
    }

    // The circle area grows with the metric value (not the radius).
    let size = Math.sqrt(((sizeConstant / threshold) * value) / Math.PI);
    if (options.view === 'app') {
        size += previewWidth;
    }
    return { width: size, height: size, warn, error, icons };
};
