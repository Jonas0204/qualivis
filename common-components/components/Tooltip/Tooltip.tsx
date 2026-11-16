import {
    cloneElement,
    type FocusEvent,
    type KeyboardEvent,
    type PointerEvent,
    type ReactElement,
    type Ref,
    useCallback,
    useEffect,
    useId,
    useRef,
} from 'react';
import { placeNextTo, type Side } from '../../lib/floating';
import './Tooltip.css';

/** Props the tooltip adds to its child; the child has to pass them on to its element. */
type TooltipTriggerProps = {
    'aria-describedby'?: string;
    ref?: Ref<HTMLElement>;
    onPointerEnter?: (event: PointerEvent<HTMLElement>) => void;
    onPointerLeave?: (event: PointerEvent<HTMLElement>) => void;
    onPointerDown?: (event: PointerEvent<HTMLElement>) => void;
    onFocus?: (event: FocusEvent<HTMLElement>) => void;
    onBlur?: (event: FocusEvent<HTMLElement>) => void;
    onKeyDown?: (event: KeyboardEvent<HTMLElement>) => void;
};

type TooltipProps = {
    text: string;
    /** One element that takes the trigger props, e.g. a Button. */
    children: ReactElement<TooltipTriggerProps>;
    side?: Side;
};

/** Hover or keyboard focus this long shows the tooltip. */
export const tooltipDelay = 500;

const setRef = <T,>(ref: Ref<T> | undefined, value: T | null) => {
    if (typeof ref === 'function') {
        ref(value);
    } else if (ref) {
        ref.current = value;
    }
};

/**
 * Short text for an element, e.g. the name of an icon button. Shown after hovering or keyboard
 * focus; hidden when the pointer leaves, on blur, on a press and on Escape. It lies in the top
 * layer (popover), so no parent can cut it off, and describes the element (aria-describedby).
 */
export const Tooltip = ({ text, children, side = 'bottom' }: TooltipProps) => {
    const id = useId();
    const anchorRef = useRef<HTMLElement>(null);
    const tooltipRef = useRef<HTMLSpanElement>(null);
    const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined);
    const openRef = useRef(false);
    // Focus after a press comes from the pointer; only keyboard focus shows the tooltip.
    const pressedRef = useRef(false);

    const hide = useCallback(() => {
        clearTimeout(timerRef.current);
        const tooltip = tooltipRef.current;
        if (tooltip && openRef.current) {
            tooltip.hidePopover();
            delete tooltip.dataset.side;
        }
        openRef.current = false;
    }, []);

    const show = () => {
        clearTimeout(timerRef.current);
        timerRef.current = setTimeout(() => {
            const tooltip = tooltipRef.current;
            const anchor = anchorRef.current;
            if (!tooltip || !anchor || openRef.current) {
                return;
            }
            tooltip.showPopover();
            openRef.current = true;
            placeNextTo(anchor, tooltip, side, 'center', 8);
        }, tooltipDelay);
    };

    // Escape hides it wherever the focus is (WCAG 1.4.13).
    useEffect(() => {
        const handleKey = (event: globalThis.KeyboardEvent) => {
            if (event.key === 'Escape') {
                hide();
            }
        };
        document.addEventListener('keydown', handleKey);
        return () => {
            document.removeEventListener('keydown', handleKey);
            clearTimeout(timerRef.current);
        };
    }, [hide]);

    const childProps = children.props;
    const childRef = childProps.ref;
    const ref = useCallback(
        (element: HTMLElement | null) => {
            anchorRef.current = element;
            setRef(childRef, element);
        },
        [childRef]
    );

    const trigger = cloneElement(children, {
        'aria-describedby': id,
        ref,
        onPointerEnter: event => {
            childProps.onPointerEnter?.(event);
            // Touch has no hover; a tap must not leave a tooltip behind.
            if (event.pointerType !== 'touch') {
                show();
            }
        },
        onPointerLeave: event => {
            childProps.onPointerLeave?.(event);
            hide();
        },
        onPointerDown: event => {
            childProps.onPointerDown?.(event);
            pressedRef.current = true;
            hide();
        },
        onFocus: event => {
            childProps.onFocus?.(event);
            if (!pressedRef.current) {
                show();
            }
        },
        onBlur: event => {
            childProps.onBlur?.(event);
            pressedRef.current = false;
            hide();
        },
        onKeyDown: event => {
            childProps.onKeyDown?.(event);
            if (event.key === 'Escape') {
                hide();
            }
        },
    } satisfies TooltipTriggerProps);

    return (
        <>
            {trigger}
            <span ref={tooltipRef} id={id} role="tooltip" popover="manual" className="cc-tooltip">
                {text}
            </span>
        </>
    );
};
