import { type ReactNode, useState } from 'react';
import { Icon } from '../Icon/Icon';
import '../../lib/toggle.css';
import './ToggleGroup.css';

export type ToggleGroupItem = {
    value: string;
    /** Text; or only `icon` with an `ariaLabel`. */
    label?: ReactNode;
    icon?: string;
    ariaLabel?: string;
    disabled?: boolean;
};

type ToggleGroupProps = {
    /** What the group controls, for screen readers. */
    label: string;
    items: readonly ToggleGroupItem[];
    /** `single`: at most one pressed; `multiple`: any number. */
    type?: 'single' | 'multiple';
    /** Controlled pressed values; or `defaultValue`. */
    value?: readonly string[];
    defaultValue?: readonly string[];
    onChange?: (value: string[]) => void;
};

/** Row of toggles, e.g. text alignment (single) or text styles (multiple). */
export const ToggleGroup = ({
    label,
    items,
    type = 'single',
    value,
    defaultValue = [],
    onChange,
}: ToggleGroupProps) => {
    const [ownValue, setOwnValue] = useState<readonly string[]>(defaultValue);
    const current = value ?? ownValue;

    const toggle = (itemValue: string) => {
        const on = current.includes(itemValue);
        const next =
            type === 'single'
                ? on
                    ? []
                    : [itemValue]
                : on
                  ? current.filter(v => v !== itemValue)
                  : [...current, itemValue];
        setOwnValue(next);
        onChange?.(next);
    };

    return (
        <fieldset aria-label={label} className="cc-toggle-group">
            {items.map(item => (
                <button
                    key={item.value}
                    type="button"
                    className="cc-toggle"
                    aria-pressed={current.includes(item.value)}
                    aria-label={item.ariaLabel}
                    disabled={item.disabled}
                    onClick={() => toggle(item.value)}
                >
                    {item.icon && <Icon name={item.icon} />}
                    {item.label}
                </button>
            ))}
        </fieldset>
    );
};
