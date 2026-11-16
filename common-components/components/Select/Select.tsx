import type { ComponentProps } from 'react';
import { cx } from '../../lib/cx';
import './Select.css';

export type SelectOption = { value: string; label: string; disabled?: boolean };

type SelectProps = Omit<ComponentProps<'select'>, 'children' | 'multiple'> & {
    options: readonly SelectOption[];
    /** Marks the value as wrong (aria-invalid). */
    invalid?: boolean;
};

/**
 * Native `<select>`: keyboard, screen readers and the mobile picker work as the browser does it.
 * Props and `ref` go to the `<select>`; `className` to its frame.
 */
export const Select = ({ options, invalid, className, ...props }: SelectProps) => (
    <>
        <span className={cx('cc-select', className)}>
            <select aria-invalid={invalid || undefined} {...props} className="cc-select__control">
                {options.map(option => (
                    <option key={option.value} value={option.value} disabled={option.disabled}>
                        {option.label}
                    </option>
                ))}
            </select>
        </span>
    </>
);
