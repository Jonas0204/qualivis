import { cx } from '../../lib/cx';
import './Icon.css';

export type IconProps = {
    /** Ligature name from the Material Icons font, e.g. `settings`. */
    name: string;
    /** Font size in px (default 20). */
    size?: number;
    className?: string;
};

/**
 * Material icon as a ligature. Decorative, so screen readers skip it; the host page loads the
 * Material Icons font (the web app does in styles/fonts.css).
 */
export const Icon = ({ name, size, className }: IconProps) => (
    <>
        <span className={cx('cc-icon', className)} aria-hidden="true" style={{ fontSize: size }}>
            {name}
        </span>
    </>
);
