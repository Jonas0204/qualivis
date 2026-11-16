import type { ComponentProps } from 'react';
import { cx } from '../../lib/cx';
import './Badge.css';

type BadgeProps = ComponentProps<'span'> & {
    variant?: 'neutral' | 'primary' | 'outline' | 'success' | 'warning' | 'danger';
};

/** Short status label, e.g. a count or a state. */
export const Badge = ({ variant = 'neutral', className, ...props }: BadgeProps) => (
    <>
        <span {...props} className={cx('cc-badge', className)} data-variant={variant} />
    </>
);
