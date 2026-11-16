import type { ReactNode } from 'react';
import './ButtonGroup.css';

type ButtonGroupProps = {
    /** What the buttons do together, for screen readers. */
    label: string;
    /** Buttons, best with the same variant (e.g. `outline`). */
    children: ReactNode;
};

/** Buttons joined into one bar. */
export const ButtonGroup = ({ label, children }: ButtonGroupProps) => (
    <>
        <fieldset aria-label={label} className="cc-button-group">
            {children}
        </fieldset>
    </>
);
