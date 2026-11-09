import styles from './Icon.module.css';

export type IconProps = {
  /** Ligature name from the Material Icons font, e.g. `settings`. */
  name: string;
  className?: string;
  /** Font size in px; without it the icon is 24 px like the Material Icons class. */
  size?: number;
};

/** Material icon as a ligature; decorative, so screen readers skip it. */
export const Icon = ({ name, className, size }: IconProps) => (
  <span
    className={className ? `${styles.icon} ${className}` : styles.icon}
    aria-hidden="true"
    style={{ fontSize: size }}
  >
    {name}
  </span>
);
