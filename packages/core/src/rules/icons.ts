// Port of GraphComponent.getNodeIcons (legacy graph.component.ts:371-470). Order, conditions and
// texts as in docs/migration/01-referenz-altsystem/03-visuelle-regeln.md §3.
import type { Node } from '../model/graph';
import { qualityMetrics, warningThreshold } from '../model/qualityMetrics';
import type { MetricReport } from '../model/report';
import { deprecatedMethods } from '../model/specialMethods';
import type { View } from './nodeVisuals';
import { metricValue, resolveThreshold } from './thresholds';

/** Text of an icon with an optional link; the legacy app used HTML strings (ADR-011 A3). */
export type IconDescription = { text: string; link?: { href: string } };

/** An icon of a graph node with its hint text. */
export type VisualIcon = { icon: string; class: 'warn' | 'error'; description: IconDescription };

/** The description as plain text, the same as the legacy HTML without tags. */
export const describeIconText = (d: IconDescription): string =>
    d.link ? `${d.text} (see ${d.link.href})` : d.text;

const thresholdTexts = {
    component: {
        warn: 'This component almost exceeds at least one metric threshold. A solution might be to split it into smaller components.',
        error: 'This component exceeds at least one metric threshold. A solution might be to split it into smaller components.',
    },
    function: {
        warn: 'This function almost exceeds at least one metric threshold. A solution might be to split it into smaller functions.',
        error: 'This function exceeds at least one metric threshold. A solution might be to split it into smaller functions.',
    },
};

/** Warning or error over all metrics; the first exceeded threshold ends the check. */
const thresholdIcon = (node: Node, report: MetricReport): VisualIcon | undefined => {
    let hasWarning = false;
    let hasError = false;
    for (const id of Object.keys(qualityMetrics)) {
        const threshold = resolveThreshold(id, node);
        // A truthiness check like the legacy code; resolveThreshold itself checks `!== undefined`.
        if (!threshold) {
            continue;
        }
        const value = metricValue(report, id);
        if (value >= threshold * warningThreshold && value < threshold) {
            hasWarning = true;
        } else if (value >= threshold) {
            hasError = true;
            break;
        }
    }
    const texts = node.type === 'component' ? thresholdTexts.component : thresholdTexts.function;
    if (hasError) {
        return { icon: 'warning', class: 'error', description: { text: texts.error } };
    }
    return hasWarning
        ? { icon: 'warning', class: 'warn', description: { text: texts.warn } }
        : undefined;
};

/**
 * Icons of a node in the legacy order: thresholds, empty or helper function, JSX, inheritance,
 * deprecated lifecycle method.
 */
export const getNodeIcons = (node: Node, report: MetricReport, view: View): VisualIcon[] => {
    const icons: VisualIcon[] = [];
    const threshold = thresholdIcon(node, report);
    if (threshold) {
        icons.push(threshold);
    }

    if (report.sloc.logical === 0) {
        icons.push({
            icon: 'delete',
            class: 'warn',
            description: { text: 'Empty functions should be removed' },
        });
    } else if (
        node.type === 'innerFunction' &&
        node.kind === 'ClassComponent' &&
        !node.isUsingThis &&
        !node.returnsJSX
    ) {
        icons.push({
            icon: 'content_cut',
            class: 'warn',
            description: {
                text: 'This function has no this reference and should be extracted into a helper function.',
            },
        });
    }

    if (node.returnsJSX && node.id !== 'render') {
        icons.push({
            icon: 'content_cut',
            class: 'warn',
            description: {
                text: 'Functions returning JSX should be components (except for the render function in class components)',
            },
        });
    }

    if (node.extends) {
        icons.push({
            icon: 'device_hub',
            class: 'warn',
            description: {
                text: 'Component composition is recommended over inheritance.',
                link: { href: 'https://reactjs.org/docs/composition-vs-inheritance.html' },
            },
        });
    }

    if (view === 'component' && deprecatedMethods.includes(node.id)) {
        icons.push({
            icon: 'report',
            class: 'warn',
            description: {
                text: 'Deprecated React lifecycle method',
                link: {
                    href: 'https://reactjs.org/docs/react-component.html#legacy-lifecycle-methods',
                },
            },
        });
    }

    return icons;
};
