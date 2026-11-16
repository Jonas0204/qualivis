import type { MetricRow } from '@qualivis/core';
import { Meter, type MeterVariant } from '../../../../../common-components';
import styles from './MetricSummary.module.css';

const variantOf: Record<MetricRow['level'], MeterVariant> = {
    ok: 'success',
    warn: 'warning',
    error: 'danger',
};

/**
 * One metric in one line (legacy quality-metric component): name and value over a bar that fills
 * to value / threshold, at most 100 %, green, from 80 % yellow, from 100 % red.
 */
export const MetricSummary = ({ row }: { row: MetricRow }) => {
    const hasValue = row.value !== undefined && row.value !== null;
    // Like Angular's interpolation: no text for a value the report lacks.
    const value = hasValue ? String(row.value) : '';
    return (
        <div className={styles.summary} data-level={row.level}>
            <div className={styles.labels}>
                <span className={styles.name}>{row.name}</span>
                <span className={styles.value}>{value}</span>
            </div>
            <Meter
                label={row.name}
                value={Number(row.value)}
                max={row.threshold}
                valueText={hasValue ? `${row.value}/${row.threshold}` : undefined}
                variant={variantOf[row.level]}
            />
        </div>
    );
};
