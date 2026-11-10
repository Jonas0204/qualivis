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
    useLayoutEffect,
    useRef,
    useState,
} from 'react';
import { createPortal } from 'react-dom';
import styles from './Tooltip.module.css';

/** Props the tooltip adds to its child; the child has to pass them on to its element. */
export type TooltipTriggerProps = {
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
};

/** Hover or keyboard focus this long shows the tooltip. */
export const tooltipShowDelay = 500;

/** Space between the element and the tooltip (.mat-tooltip margin). */
const gap = 14;
/** The tooltip keeps this far from the window edges (Material's viewport margin). */
const windowMargin = 8;

const setRef = <T,>(ref: Ref<T> | undefined, value: T | null) => {
    if (typeof ref === 'function') {
        ref(value);
    } else if (ref) {
        ref.current = value;
    }
};

/**
 * Tooltip below an element, like matTooltip: shown after hovering or keyboard focus, hidden when
 * the pointer leaves, on blur and on Escape. The text describes the element (aria-describedby).
 * Unlike matTooltip it also hides when the element is pressed, so it does not cover an opened
 * select list.
 */
export const Tooltip = ({ text, children }: TooltipProps) => {
    const id = useId();
    const [open, setOpen] = useState(false);
    const [position, setPosition] = useState<{ left: number; top: number }>();
    const anchorRef = useRef<HTMLElement>(null);
    const tooltipRef = useRef<HTMLSpanElement>(null);
    const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined);
    // Focus after a press comes from the pointer: matTooltip shows only on keyboard focus.
    const pressedRef = useRef(false);

    const show = () => {
        clearTimeout(timerRef.current);
        timerRef.current = setTimeout(() => setOpen(true), tooltipShowDelay);
    };
    const hide = () => {
        clearTimeout(timerRef.current);
        setOpen(false);
        setPosition(undefined);
    };

    useEffect(() => () => clearTimeout(timerRef.current), []);

    // Below the middle of the element, inside the window. offsetWidth, as the scale animation
    // changes the measured box.
    useLayoutEffect(() => {
        const anchor = anchorRef.current;
        const tooltip = tooltipRef.current;
        if (!open || !anchor || !tooltip) {
            return;
        }
        const box = anchor.getBoundingClientRect();
        const width = tooltip.offsetWidth;
        const left = Math.max(
            windowMargin,
            Math.min(box.left + box.width / 2 - width / 2, window.innerWidth - width - windowMargin)
        );
        setPosition({ left, top: box.bottom + gap });
    }, [open]);

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
            // matTooltip shows on mouseenter, which touch does not fire before the tap.
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
            {createPortal(
                <span
                    ref={tooltipRef}
                    id={id}
                    role="tooltip"
                    className={styles.tooltip}
                    hidden={!open}
                    style={position ?? { visibility: 'hidden' }}
                >
                    {text}
                </span>,
                document.body
            )}
        </>
    );
};
