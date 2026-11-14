type PointerHandlers = {
    move: (event: PointerEvent) => void;
    /** Pointer released or cancelled; the tracking has already stopped. */
    end: (event: PointerEvent) => void;
};

/**
 * Follows one pointer on the window until it is released, as d3-drag and d3-zoom follow the mouse
 * after a mouse down. Returns a function that stops following.
 */
export const trackPointer = (
    view: Window,
    pointerId: number,
    { move, end }: PointerHandlers
): (() => void) => {
    const onMove = (event: PointerEvent) => {
        if (event.pointerId === pointerId) {
            move(event);
        }
    };
    const onEnd = (event: PointerEvent) => {
        if (event.pointerId === pointerId) {
            stop();
            end(event);
        }
    };
    const stop = () => {
        view.removeEventListener('pointermove', onMove, true);
        view.removeEventListener('pointerup', onEnd, true);
        view.removeEventListener('pointercancel', onEnd, true);
    };

    view.addEventListener('pointermove', onMove, true);
    view.addEventListener('pointerup', onEnd, true);
    view.addEventListener('pointercancel', onEnd, true);
    return stop;
};

/**
 * Swallows the click that follows a drag or a pan, so it neither selects nor deselects: d3-drag and
 * d3-zoom do the same when the mouse moved (yesdrag with noclick).
 */
export const suppressNextClick = (view: Window): void => {
    const swallow = (event: MouseEvent) => {
        event.preventDefault();
        event.stopImmediatePropagation();
    };
    view.addEventListener('click', swallow, true);
    setTimeout(() => view.removeEventListener('click', swallow, true), 0);
};

/** Pointer position relative to the top left corner of the SVG. */
export const svgPoint = (svg: Element, event: { clientX: number; clientY: number }) => {
    const rect = svg.getBoundingClientRect();
    return { x: event.clientX - rect.left, y: event.clientY - rect.top };
};
