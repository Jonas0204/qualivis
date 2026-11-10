import type { MetricRow } from '@qualivis/core';
import styles from './QualityMetricBar.module.css';

type QualityMetricBarProps = { row: MetricRow };

const levelClass = { ok: styles.ok, warn: styles.warn, error: styles.error };

/**
 * One metric of the code quality panel (legacy quality-metric component): name and value over a
 * bar that fills to value / threshold, at most 100 %, green, from 80 % yellow, from 100 % red.
 */
export const QualityMetricBar = ({ row }: QualityMetricBarProps) => {
    const fill = Math.min(Math.max(Number.isFinite(row.ratio) ? row.ratio : 0, 0), 1) * 100;
    // Like Angular's interpolation: no text for a value the report lacks.
    const value = row.value === undefined || row.value === null ? '' : String(row.value);

    return (
        <div className={styles.metric} data-level={row.level}>
            <span className={styles.name} title={row.description ?? ''}>
                {row.name}
            </span>
            <span className={styles.value} title={`${row.value}/${row.threshold}`}>
                {value}
            </span>
            {/* biome-ignore lint/a11y/useSemanticElements: a <meter> cannot be styled like the legacy Material bar */}
            <div
                className={`${styles.bar} ${levelClass[row.level]}`}
                role="meter"
                aria-label={row.name}
                aria-valuenow={Number.isFinite(Number(row.value)) ? Number(row.value) : 0}
                aria-valuemin={0}
                aria-valuemax={row.threshold}
            >
                <div className={styles.fill} style={{ width: `${fill}%` }} />
            </div>
        </div>
    );
};
