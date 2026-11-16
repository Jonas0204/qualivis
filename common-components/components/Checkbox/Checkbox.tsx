import { type ComponentProps, type ReactNode, useEffect, useRef } from 'react';
import '../../lib/choice.css';
import './Checkbox.css';

type CheckboxProps = Omit<ComponentProps<'input'>, 'type'> & {
    /** Text next to the box; without it the box needs an `aria-label`. */
    label?: ReactNode;
    description?: ReactNode;
    /** Shows a dash for "some of them" (sets the DOM property, no attribute exists). */
    indeterminate?: boolean;
};

/** Native checkbox with its own look. */
export const Checkbox = ({
    label,
    description,
    indeterminate = false,
    ...props
}: CheckboxProps) => {
    const ref = useRef<HTMLInputElement>(null);
    useEffect(() => {
        if (ref.current) {
            ref.current.indeterminate = indeterminate;
        }
    }, [indeterminate]);

    const box = <input ref={ref} type="checkbox" {...props} className="cc-checkbox" />;
    return (
        <>
            {label === undefined ? (
                box
            ) : (
                // biome-ignore lint/a11y/noLabelWithoutControl: the input is `box` inside the label
                <label className="cc-choice">
                    {box}
                    <span className="cc-choice__text">
                        {label}
                        {description !== undefined && (
                            <span className="cc-choice__description">{description}</span>
                        )}
                    </span>
                </label>
            )}
        </>
    );
};
