import { type ComponentProps, type CSSProperties, useState } from 'react';
import { cx } from '../../lib/cx';
import './Slider.css';

type SliderProps = Omit<
    ComponentProps<'input'>,
    'type' | 'min' | 'max' | 'value' | 'defaultValue'
> & {
    min?: number;
    max?: number;
    /** Controlled value; or `defaultValue` for an uncontrolled slider. */
    value?: number;
    defaultValue?: number;
};

/** Native range input; the part left of the thumb is filled. Needs a label or `aria-label`. */
export const Slider = ({
    min = 0,
    max = 100,
    value,
    defaultValue,
    onChange,
    className,
    style,
    ...props
}: SliderProps) => {
    // The fill follows the value; an uncontrolled slider tracks it here.
    const [ownValue, setOwnValue] = useState(defaultValue ?? min);
    const current = value ?? ownValue;
    const fill = max > min ? ((current - min) / (max - min)) * 100 : 0;
    return (
        <input
            type="range"
            min={min}
            max={max}
            {...(value === undefined ? { defaultValue } : { value })}
            {...props}
            className={cx('cc-slider', className)}
            style={{ ...style, '--_fill': `${fill}%` } as CSSProperties}
            onChange={event => {
                setOwnValue(Number(event.currentTarget.value));
                onChange?.(event);
            }}
        />
    );
};
