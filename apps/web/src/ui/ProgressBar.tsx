import styles from './ProgressBar.module.css';

type ProgressBarProps = {
    /** Progress in percent; values outside 0 to 100 are clamped like mat-progress-bar does. */
    value: number;
};

/** Determinate progress bar like Material's mat-progress-bar, pinned to the top of its container. */
export const ProgressBar = ({ value }: ProgressBarProps) => {
    // The core's progress sum can end slightly above 100 (floating point), e.g. 100.00000000000001.
    const percent = Math.min(100, Math.max(0, value));
    return (
        <div
            className={styles.bar}
            role="progressbar"
            aria-valuenow={percent}
            aria-valuemin={0}
            aria-valuemax={100}
        >
            <div className={styles.fill} style={{ width: `${percent}%` }} />
        </div>
    );
};
