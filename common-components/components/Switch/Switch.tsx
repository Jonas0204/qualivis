import type { ComponentProps, ReactNode } from 'react';
import '../../lib/choice.css';
import './Switch.css';

type SwitchProps = Omit<ComponentProps<'input'>, 'type' | 'role'> & {
    /** Text next to the switch; without it the switch needs an `aria-label`. */
    label?: ReactNode;
    description?: ReactNode;
};

/** On/off setting that applies at once: a native checkbox with `role="switch"`. */
export const Switch = ({ label, description, ...props }: SwitchProps) => {
    const control = (
        // biome-ignore lint/a11y/useAriaPropsForRole: browsers take the checked state of the native checkbox for the switch role
        <input type="checkbox" role="switch" {...props} className="cc-switch" />
    );
    return (
        <>
            {label === undefined ? (
                control
            ) : (
                // biome-ignore lint/a11y/noLabelWithoutControl: the input is `control` inside the label
                <label className="cc-choice">
                    {control}
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
