import { useContext } from 'react';
import { cx } from '../../lib/cx';
import { IconSetContext } from './iconSet';
import './Icon.css';

export type IconProps = {
    /** Name of an own icon from an IconProvider, otherwise a Material Icons ligature (`settings`). */
    name: string;
    /** Edge length in px (default 20). */
    size?: number;
    className?: string;
};

/**
 * An icon by name: an own SVG icon if an IconProvider above has one of that name, otherwise the
 * Material icon as a ligature (the host page loads the font, the web app in styles/fonts.css).
 * Decorative, so screen readers skip it.
 */
export const Icon = ({ name, size, className }: IconProps) => {
    const svg = useContext(IconSetContext)[name];
    const style = size === undefined ? undefined : { fontSize: size };

    return svg ? (
        <svg
            className={cx('cc-icon', className)}
            viewBox={svg.viewBox}
            aria-hidden="true"
            style={style}
        >
            {svg.content}
        </svg>
    ) : (
        <span className={cx('cc-icon', className)} aria-hidden="true" style={style}>
            {name}
        </span>
    );
};
