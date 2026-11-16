import { type ReactNode, useEffect, useState } from 'react';
import { Button } from '../Button/Button';
import { Icon } from '../Icon/Icon';
import './Toast.css';

const icons = { neutral: 'info', success: 'check_circle', danger: 'error' };

type ToastProps = {
    open: boolean;
    /** Called when the time runs out or the user closes the toast. */
    onClose: () => void;
    title: ReactNode;
    description?: ReactNode;
    action?: { label: string; onClick: () => void };
    variant?: 'neutral' | 'success' | 'danger';
    /** Milliseconds until it closes by itself (default 5000); 0 keeps it open. */
    duration?: number;
};

/**
 * Short message in the bottom right corner. The region is always in the page and polite, so
 * screen readers announce a new message; the timer pauses while the pointer or focus is on it.
 */
export const Toast = ({
    open,
    onClose,
    title,
    description,
    action,
    variant = 'neutral',
    duration = 5000,
}: ToastProps) => {
    const [paused, setPaused] = useState(false);

    useEffect(() => {
        if (!open || paused || duration === 0) {
            return;
        }
        const timer = setTimeout(onClose, duration);
        return () => clearTimeout(timer);
    }, [open, paused, duration, onClose]);

    return (
        <div className="cc-toast-region" role="status" aria-live="polite">
            {open && (
                // biome-ignore lint/a11y/noStaticElementInteractions: the handlers only pause the timer; the toast does nothing itself
                <div
                    className="cc-toast"
                    data-variant={variant}
                    onPointerEnter={() => setPaused(true)}
                    onPointerLeave={() => setPaused(false)}
                    onFocus={() => setPaused(true)}
                    onBlur={() => setPaused(false)}
                >
                    <Icon name={icons[variant]} />
                    <div className="cc-toast__text">
                        <p className="cc-toast__title">{title}</p>
                        {description !== undefined && (
                            <p className="cc-toast__description">{description}</p>
                        )}
                    </div>
                    <div className="cc-toast__actions">
                        {action && (
                            <Button
                                size="sm"
                                variant="secondary"
                                onClick={() => {
                                    action.onClick();
                                    onClose();
                                }}
                            >
                                {action.label}
                            </Button>
                        )}
                        <Button size="icon-sm" aria-label="Close" onClick={onClose}>
                            <Icon name="close" />
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
};
