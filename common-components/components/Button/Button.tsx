import type { ComponentProps } from 'react';
import { cx } from '../../lib/cx';
import './Button.css';

export type ButtonProps = ComponentProps<'button'> & {
    /** `ghost` (default) has no background; `primary` is for the main action of a view. */
    variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'link';
    /** `icon` and `icon-sm` are square; such a button needs an `aria-label`. */
    size?: 'sm' | 'md' | 'lg' | 'icon' | 'icon-sm';
};

/** A plain `<button>` of type "button" unless `type` says otherwise. */
export const Button = ({ variant = 'ghost', size = 'md', className, ...props }: ButtonProps) => (
    <>
        <button
            type="button"
            {...props}
            className={cx('cc-button', className)}
            data-variant={variant}
            data-size={size}
        />
    </>
);
