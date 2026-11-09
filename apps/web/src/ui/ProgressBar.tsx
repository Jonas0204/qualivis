import styles from './ProgressBar.module.css';

type ProgressBarProps = {
  /** Progress in percent, 0 to 100. */
  value: number;
};

/** Determinate progress bar like Material's mat-progress-bar, pinned to the top of its container. */
export const ProgressBar = ({ value }: ProgressBarProps) => (
  <div
    className={styles.bar}
    role="progressbar"
    aria-valuenow={value}
    aria-valuemin={0}
    aria-valuemax={100}
  >
    <div className={styles.fill} style={{ width: `${value}%` }} />
  </div>
);
