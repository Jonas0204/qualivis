import { type ReactNode, type RefObject, useId, useRef } from 'react';
import { type Align, type Side, useAnchoredPopover } from '../../lib/floating';
import '../../lib/floating.css';
import './Popover.css';

/** Props for the button that opens the popover. */
export type PopoverTriggerProps = {
    ref: RefObject<HTMLButtonElement | null>;
    popoverTarget: string;
    'aria-haspopup': 'dialog';
    'aria-expanded': boolean;
    'aria-controls': string;
};

type PopoverProps = {
    /** Renders the button that opens and closes the popover: `props => <Button {...props} />`. */
    trigger: (props: PopoverTriggerProps) => ReactNode;
    /** Content; as a function it gets `close`. */
    children: ReactNode | ((close: () => void) => ReactNode);
    /** Name of the popover, for screen readers. */
    label: string;
    side?: Side;
    align?: Align;
};

/**
 * Panel next to a button, e.g. for settings or a small form. Native popover API: a click outside
 * and Escape close it, and the focus goes back to the button.
 */
export const Popover = ({ trigger, children, label, side, align }: PopoverProps) => {
    const id = useId();
    const anchorRef = useRef<HTMLButtonElement>(null);
    const popoverRef = useRef<HTMLDivElement>(null);
    const open = useAnchoredPopover(anchorRef, popoverRef, side, align);
    const close = () => popoverRef.current?.hidePopover();

    return (
        <>
            {trigger({
                ref: anchorRef,
                popoverTarget: id,
                'aria-haspopup': 'dialog',
                'aria-expanded': open,
                'aria-controls': id,
            })}
            <div
                ref={popoverRef}
                id={id}
                popover="auto"
                role="dialog"
                aria-label={label}
                className="cc-floating cc-popover"
            >
                {typeof children === 'function' ? children(close) : children}
            </div>
        </>
    );
};
