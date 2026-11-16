import { type MetricRow, qualityMetrics, warningThreshold } from '@qualivis/core';
import styles from './MetricExplanation.module.css';
import { metricExplanations, thresholdKinds } from './metricExplanations';

/** Up to three decimals, without trailing zeros. */
const formatNumber = (value: number) => String(Math.round(value * 1000) / 1000);

/**
 * What a metric measures, its formula and thresholds (ADR-011 A23). Starts with the short
 * description of the metric, which the legacy app showed as the tooltip of its name.
 */
export const MetricExplanation = ({ row }: { row: MetricRow }) => {
    const explanation = metricExplanations[row.id];
    const thresholds = Object.entries(qualityMetrics[row.id]?.thresholds ?? {});
    const percent = Number.isFinite(row.ratio) ? Math.round(row.ratio * 100) : undefined;

    return (
        <section className={styles.explanation} aria-label={`About ${row.name}`}>
            {row.description && <p className={styles.description}>{row.description}</p>}
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
