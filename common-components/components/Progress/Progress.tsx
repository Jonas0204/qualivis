import './Progress.css';

type ProgressProps = {
    /** Percent from 0 to 100; values outside are clamped. Without it the bar runs endlessly. */
    value?: number;
    /** What is loading, for screen readers. */
    label: string;
};

/** Progress bar. */
export const Progress = ({ value, label }: ProgressProps) => {
    const percent = value === undefined ? undefined : Math.min(100, Math.max(0, value));
    return (
        <div
            className="cc-progress"
            role="progressbar"
            aria-label={label}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={percent}
        >
            <div
                className="cc-progress__fill"
                style={percent === undefined ? undefined : { width: `${percent}%` }}
            />
        </div>
    );
};
