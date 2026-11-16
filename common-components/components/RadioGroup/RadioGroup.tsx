import { type ReactNode, useId } from 'react';
import '../../lib/choice.css';
import './RadioGroup.css';

export type RadioOption = {
    value: string;
    label: ReactNode;
    description?: ReactNode;
    disabled?: boolean;
};

type RadioGroupProps = {
    /** Shown as the legend of the group. */
    label: ReactNode;
    options: readonly RadioOption[];
    /** Controlled value; or `defaultValue` for an uncontrolled group. */
    value?: string;
    defaultValue?: string;
    onChange?: (value: string) => void;
    orientation?: 'vertical' | 'horizontal';
};

/** Native radio buttons in a fieldset; arrow keys move between them as usual. */
export const RadioGroup = ({
    label,
    options,
    value,
    defaultValue,
    onChange,
    orientation = 'vertical',
}: RadioGroupProps) => {
    const name = useId();
    return (
        <fieldset className="cc-radio-group" data-orientation={orientation}>
            <legend className="cc-radio-group__legend">{label}</legend>
            {options.map(option => (
                <label key={option.value} className="cc-choice">
                    <input
                        type="radio"
                        className="cc-radio"
                        name={name}
                        value={option.value}
                        disabled={option.disabled}
                        {...(value === undefined
                            ? { defaultChecked: option.value === defaultValue }
                            : { checked: option.value === value })}
                        onChange={() => onChange?.(option.value)}
                    />
                    <span className="cc-choice__text">
                        {option.label}
                        {option.description !== undefined && (
                            <span className="cc-choice__description">{option.description}</span>
                        )}
                    </span>
                </label>
            ))}
        </fieldset>
    );
};
