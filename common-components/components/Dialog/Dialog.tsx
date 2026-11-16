import { type ReactNode, useId, useRef } from 'react';
import { useModalDialog } from '../../lib/useModalDialog';
import { Button } from '../Button/Button';
import { Icon } from '../Icon/Icon';
import '../../lib/dialog.css';
import './Dialog.css';

type DialogProps = {
    open: boolean;
    /** Escape, the close button and (unless `alert`) a click on the backdrop call it. */
    onClose: () => void;
    title: ReactNode;
    description?: ReactNode;
    children?: ReactNode;
    /** Bottom bar, e.g. Cancel and OK. */
    footer?: ReactNode;
    /**
     * A question the user must answer (role "alertdialog"): no close button, no closing by a click
     * outside. Give the safe button `autoFocus`.
     */
    alert?: boolean;
    size?: 'sm' | 'md' | 'lg';
};

/**
 * Modal dialog on the native `<dialog>`: the page behind is inert, the focus stays inside and goes
 * back to the opener when it closes.
 */
export const Dialog = ({
    open,
    onClose,
    title,
    description,
    children,
    footer,
    alert = false,
    size = 'md',
}: DialogProps) => {
    const id = useId();
    const ref = useRef<HTMLDialogElement>(null);
    const handleClick = useModalDialog(ref, open, onClose, !alert);

    return (
        <>
            {/* biome-ignore lint/a11y/useKeyWithClickEvents: the click only closes on the backdrop; Escape does that for keyboards */}
            <dialog
                ref={ref}
                className="cc-dialog"
                data-kind="dialog"
                data-size={size}
                role={alert ? 'alertdialog' : undefined}
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
                    {!alert && (
                        <Button size="icon-sm" aria-label="Close" onClick={onClose}>
                            <Icon name="close" />
                        </Button>
                    )}
                </div>
                {children !== undefined && <div className="cc-dialog__body">{children}</div>}
                {footer !== undefined && <div className="cc-dialog__footer">{footer}</div>}
            </dialog>
        </>
    );
};
