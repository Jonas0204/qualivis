import type { ComponentProps } from 'react';
import styles from './Button.module.css';

export type ButtonProps = ComponentProps<'button'> & {
    /** mat-button, mat-stroked-button or mat-raised-button. */
    variant?: 'text' | 'stroked' | 'raised';
    /** Without it the button takes the colour of its parent. */
    color?: 'primary';
};

/** Material-style button; a plain `button` of type "button" unless `type` says otherwise. */
export const Button = ({ variant = 'text', color, className, ...props }: ButtonProps) => (
    <button
        type="button"
        {...props}
        className={[styles.button, styles[variant], color && styles[color], className]
            .filter(Boolean)
            .join(' ')}
    />
);
