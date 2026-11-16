import type { ComponentProps } from 'react';
import { cx } from '../../lib/cx';
import { Icon } from '../Icon/Icon';
import './Input.css';

type InputProps = ComponentProps<'input'> & {
    /** Material icon in front of the text, e.g. `search`. */
    icon?: string;
    /** Marks the value as wrong (aria-invalid); the reason goes into a Field error. */
    invalid?: boolean;
};

/** One-line text field. Props and `ref` go to the `<input>`; `className` to its frame. */
export const Input = ({ icon, invalid, className, ...props }: InputProps) => (
    <>
        <span className={cx('cc-input', className)}>
            {icon && <Icon name={icon} />}
            <input aria-invalid={invalid || undefined} {...props} className="cc-input__control" />
        </span>
    </>
);
