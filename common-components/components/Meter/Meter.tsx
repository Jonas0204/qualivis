import { cx } from '../../lib/cx';
import './Meter.css';

export type MeterVariant = 'default' | 'success' | 'warning' | 'danger';

type MeterProps = {
    /** The measured value; the bar fills to value / max and stops at both ends. */
    value: number;
    /** Upper end of the scale (default 100). */
    max?: number;
    /** What is measured, for screen readers. */
    label: string;
    /** Value as screen readers say it, e.g. "12 of 20" (default: the number). */
    valueText?: string;
    /** Colour of the fill, e.g. by how close the value is to a limit. */
    variant?: MeterVariant;
    className?: string;
};

/**
 * A measured value on a known scale (a gauge, not a loading bar like Progress). Built as
 * role="meter" because a native `<meter>` cannot be styled the same in every browser.
 */
export const Meter = ({
    value,
    max = 100,
    label,
    valueText,
    variant = 'default',
    className,
}: MeterProps) => {
    const ratio = Number.isFinite(value) && max > 0 ? Math.min(Math.max(value / max, 0), 1) : 0;
    return (
        // biome-ignore lint/a11y/useSemanticElements: a native <meter> cannot be styled the same in every browser
        <div
            className={cx('cc-meter', className)}
            data-variant={variant}
            role="meter"
            aria-label={label}
            aria-valuemin={0}
            aria-valuemax={max}
            aria-valuenow={Number.isFinite(value) ? value : 0}
            aria-valuetext={valueText}
        >
            <div className="cc-meter__fill" style={{ width: `${ratio * 100}%` }} />
        </div>
    );
};
