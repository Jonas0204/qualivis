import { type ReactNode, useId, useRef } from 'react';
import { useModalDialog } from '../../lib/useModalDialog';
import { Button } from '../Button/Button';
import { Icon } from '../Icon/Icon';
import '../../lib/dialog.css';
import './Sheet.css';

type SheetProps = {
    open: boolean;
    /** Escape, the close button and a click on the backdrop call it. */
    onClose: () => void;
    title: ReactNode;
    description?: ReactNode;
    children?: ReactNode;
    footer?: ReactNode;
    side?: 'left' | 'right';
};

/** Modal panel that slides in from the side of the window, e.g. for settings or details. */
export const Sheet = ({
    open,
    onClose,
    title,
    description,
    children,
    footer,
    side = 'right',
}: SheetProps) => {
    const id = useId();
    const ref = useRef<HTMLDialogElement>(null);
    const handleClick = useModalDialog(ref, open, onClose, true);

    return (
        <>
            {/* biome-ignore lint/a11y/useKeyWithClickEvents: the click only closes on the backdrop; Escape does that for keyboards */}
            <dialog
                ref={ref}
                className="cc-dialog"
                data-kind="sheet"
                data-side={side}
                aria-labelledby={`${id}-title`}
                aria-describedby={description === undefined ? undefined : `${id}-description`}
                onClick={handleClick}
            >
                <div className="cc-dialog__header">
                    <div className="cc-dialog__heading">
                        <h2 id={`${id}-title`} className="cc-dialog__title">
                            {title}
                        </h2>
                        {description !== undefined && (
                            <p id={`${id}-description`} className="cc-dialog__description">
                                {description}
                            </p>
                        )}
                    </div>
                    <Button size="icon-sm" aria-label="Close" onClick={onClose}>
                        <Icon name="close" />
                    </Button>
                </div>
                {children !== undefined && <div className="cc-dialog__body">{children}</div>}
                {footer !== undefined && <div className="cc-dialog__footer">{footer}</div>}
            </dialog>
        </>
    );
};
