import { metricRows, qualityMetrics } from '@qualivis/core';
import { useAtomValue } from 'jotai';
import { useEffect, useMemo } from 'react';
import type { NodeSelection } from '../../state/selection';
import { selectionAtom } from '../../state/selectionAtoms';
import styles from './CodeQualityPanel.module.css';
import { IconDescription } from './IconDescription';
import { QualityMetricBar } from './QualityMetricBar';

type CodeQualityContentProps = { selectedNode: NodeSelection | undefined };

/** The panel for one selection; CodeQualityPanel passes the first selected node. */
export const CodeQualityContent = ({ selectedNode }: CodeQualityContentProps) => {
    const report = selectedNode?.report?.aggregate ?? selectedNode?.report;
    const rows = useMemo(() => (selectedNode ? metricRows(selectedNode) : []), [selectedNode]);

    useEffect(() => {
        if (report) {
            // biome-ignore lint/suspicious/noConsole: legacy log, kept for debugging (user, 09.11.2026)
            console.log('Report', report);
        }
    }, [report]);

    return (
        <div className={styles.panel}>
            <div className={styles.headerContainer}>
                <h2 className={styles.header}>
                    Code Quality
                    {/* Like the legacy template, the name only with a report. */}
                    {report && selectedNode && (
                        <span className={styles.name}>
                            {' '}
                            {selectedNode.label || selectedNode.id}
                            {selectedNode.report?.aggregate ? ' (aggregate)' : ''}
                        </span>
                    )}
                </h2>
            </div>
            {selectedNode && (
                <div>
                    {/* Without a report there are no bars; the legacy template threw there and kept
                        the bars of the selection before (ADR-011 A20). */}
                    {rows.map(row => (
                        <QualityMetricBar key={row.id} row={row} />
                    ))}
                    <div className={styles.iconDescriptions}>
                        {selectedNode.icons?.map((icon, index) => (
                            <IconDescription
                                // Two icons of a node can have the same kind and text.
                                key={`${index} ${icon.icon} ${icon.description.text}`}
                                icon={icon}
                            />
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

/** Code quality of the first selected node, top of the right column (Q1-Q5). */
export const CodeQualityPanel = () => {
    const selection = useAtomValue(selectionAtom);

    useEffect(() => {
        // biome-ignore lint/suspicious/noConsole: legacy log of the panel constructor, kept for debugging (user, 09.11.2026)
        console.log(qualityMetrics);
    }, []);

    return <CodeQualityContent selectedNode={selection?.[0]} />;
};
