import type { ComponentProps } from 'react';
import { cx } from '../../lib/cx';
import './Textarea.css';

type TextareaProps = ComponentProps<'textarea'> & {
    /** Marks the value as wrong (aria-invalid). */
    invalid?: boolean;
};

/** Text field for several lines; the user can make it taller. */
export const Textarea = ({ invalid, className, ...props }: TextareaProps) => (
    <>
        <textarea
            aria-invalid={invalid || undefined}
            {...props}
            className={cx('cc-textarea', className)}
        />
    </>
);
