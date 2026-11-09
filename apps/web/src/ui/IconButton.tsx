import type { ComponentProps, ReactElement } from 'react';
import styles from './Button.module.css';
import type { IconProps } from './Icon';

export type IconButtonProps = Omit<ComponentProps<'button'>, 'aria-label' | 'children'> & {
    /** The icon says nothing to screen readers, so the label is required. */
    'aria-label': string;
    children: ReactElement<IconProps>;
};

/** Round 40 × 40 button with an icon (mat-icon-button). */
export const IconButton = ({ className, ...props }: IconButtonProps) => (
    <button
        type="button"
        {...props}
        className={[styles.button, styles.iconButton, className].filter(Boolean).join(' ')}
    />
);
