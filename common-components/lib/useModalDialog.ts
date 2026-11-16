import { type MouseEvent, type RefObject, useEffect } from 'react';

/**
 * Opens and closes a native `<dialog>` as a modal from the `open` prop. Escape and, unless the
 * dialog is an alert, a click on the backdrop call `onClose`; the parent then sets `open` to false.
 * Returns the click handler for the dialog element.
 */
export const useModalDialog = (
    ref: RefObject<HTMLDialogElement | null>,
    open: boolean,
    onClose: () => void,
    dismissOnBackdrop: boolean
) => {
    useEffect(() => {
        const dialog = ref.current;
        if (!dialog) {
            return;
        }
        if (open && !dialog.open) {
            dialog.showModal();
        } else if (!open && dialog.open) {
            dialog.close();
        }
    }, [ref, open]);

    useEffect(() => {
        const dialog = ref.current;
        if (!dialog) {
            return;
        }
        // Escape fires "cancel"; the parent decides, so the browser must not close it by itself.
        const handleCancel = (event: Event) => {
            event.preventDefault();
            onClose();
        };
        dialog.addEventListener('cancel', handleCancel);
        return () => dialog.removeEventListener('cancel', handleCancel);
    }, [ref, onClose]);

    // A click on the backdrop targets the dialog element itself, outside its content box.
    return (event: MouseEvent<HTMLDialogElement>) => {
        if (!dismissOnBackdrop || event.target !== event.currentTarget) {
            return;
        }
        const box = event.currentTarget.getBoundingClientRect();
        const inside =
            event.clientX >= box.left &&
            event.clientX <= box.right &&
            event.clientY >= box.top &&
            event.clientY <= box.bottom;
        if (!inside) {
            onClose();
        }
    };
};
