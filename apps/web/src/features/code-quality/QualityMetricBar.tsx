import { type MetricRow, qualityMetrics, warningThreshold } from '@qualivis/core';
import { useId, useState } from 'react';
import { metricExplanations, thresholdKinds } from './metricExplanations';
import styles from './QualityMetricBar.module.css';

type QualityMetricBarProps = { row: MetricRow };

const levelClass = { ok: styles.ok, warn: styles.warn, error: styles.error };

/** Up to three decimals, without trailing zeros. */
const formatNumber = (value: number) => String(Math.round(value * 1000) / 1000);

/** What the metric measures, its formula and thresholds (ADR-011 A23). */
const MetricExplanationView = ({ row, id }: { row: MetricRow; id: string }) => {
    const explanation = metricExplanations[row.id];
    const thresholds = Object.entries(qualityMetrics[row.id]?.thresholds ?? {});
    const percent = Number.isFinite(row.ratio) ? Math.round(row.ratio * 100) : undefined;

    return (
        <section id={id} className={styles.explanation} aria-label={`About ${row.name}`}>
            {explanation && (
                <>
                    <p>{explanation.measures}</p>
                    <pre className={styles.formula}>{explanation.formula.join('\n')}</pre>
                    <ul className={styles.notes}>
                        {explanation.notes.map(note => (
                            <li key={note}>{note}</li>
                        ))}
                    </ul>
                </>
            )}
            <p className={styles.thresholds}>
                Threshold here {formatNumber(row.threshold)}
                {percent !== undefined && ` (value ${percent} %)`}: yellow from{' '}
                {formatNumber(row.threshold * warningThreshold)}, red from{' '}
                {formatNumber(row.threshold)}.
                {thresholds.length > 1 &&
                    ` Defaults: ${thresholds
                        .map(([kind, value]) => `${thresholdKinds[kind] ?? kind} ${value}`)
                        .join(', ')}.`}
            </p>
        </section>
    );
};

/**
 * One metric of the code quality panel (legacy quality-metric component): name and value over a
 * bar that fills to value / threshold, at most 100 %, green, from 80 % yellow, from 100 % red.
 * A click on the name shows what the metric measures and how it is computed (ADR-011 A23).
 */
export const QualityMetricBar = ({ row }: QualityMetricBarProps) => {
    const [open, setOpen] = useState(false);
    const explanationId = useId();
    const fill = Math.min(Math.max(Number.isFinite(row.ratio) ? row.ratio : 0, 0), 1) * 100;
    // Like Angular's interpolation: no text for a value the report lacks.
    const value = row.value === undefined || row.value === null ? '' : String(row.value);

    return (
        <div className={styles.item}>
            <div className={styles.metric} data-level={row.level}>
                <span className={styles.name} title={row.description ?? ''}>
                    <button
                        type="button"
                        className={styles.toggle}
                        aria-expanded={open}
                        aria-controls={explanationId}
                        onClick={() => setOpen(shown => !shown)}
                    >
                        {row.name}
                    </button>
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
            {open && <MetricExplanationView row={row} id={explanationId} />}
        </div>
    );
};
