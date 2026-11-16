import { type RefObject, useEffect, useState } from 'react';

export type Side = 'top' | 'bottom';
export type Align = 'start' | 'center' | 'end';

/** Floating elements keep this far from the window edges. */
const windowMargin = 8;

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

/**
 * Puts a floating element (a popover in the top layer, `position: fixed`) next to its anchor. It
 * moves to the other side when it does not fit and stays inside the window.
 */
export const placeNextTo = (
    anchor: Element,
    floating: HTMLElement,
    side: Side = 'bottom',
    align: Align = 'start',
    gap = 6
) => {
    const box = anchor.getBoundingClientRect();
    const width = floating.offsetWidth;
    const height = floating.offsetHeight;
    const below = box.bottom + gap;
    const above = box.top - height - gap;
    const fitsBelow = below + height <= window.innerHeight - windowMargin;
    const fitsAbove = above >= windowMargin;
    const top =
        side === 'bottom'
            ? fitsBelow || !fitsAbove
                ? below
                : above
            : fitsAbove || !fitsBelow
              ? above
              : below;
    const left = {
        start: box.left,
        center: box.left + box.width / 2 - width / 2,
        end: box.right - width,
    }[align];
    floating.style.top = `${Math.max(top, windowMargin)}px`;
    floating.style.left = `${clamp(left, windowMargin, window.innerWidth - width - windowMargin)}px`;
    floating.dataset.side = top === below ? 'bottom' : 'top';
};

/**
 * Keeps a popover next to its anchor while it is open: placed when it opens, and again on scroll
 * and resize. Works for popovers opened by `popovertarget` and by `showPopover()`. Returns whether
 * the popover is open.
 */
export const useAnchoredPopover = (
    anchorRef: RefObject<HTMLElement | null>,
    popoverRef: RefObject<HTMLElement | null>,
    side: Side = 'bottom',
    align: Align = 'start'
) => {
    const [open, setOpen] = useState(false);
    useEffect(() => {
        const popover = popoverRef.current;
        if (!popover) {
            return;
        }
        const place = () => {
            if (anchorRef.current && popover.matches(':popover-open')) {
                placeNextTo(anchorRef.current, popover, side, align);
            }
        };
        const stopFollowing = () => {
            window.removeEventListener('resize', place);
            window.removeEventListener('scroll', place, true);
        };
        // "beforetoggle" fires at once, before the popover changes; "toggle" fires later and the
        // browser merges quick changes into one event, so it can come too late or not at all.
        const handleBeforeToggle = (event: Event) => {
            if ((event as ToggleEvent).newState === 'open') {
                // The popover is shown after this handler (a microtask can still run before that,
                // after a real click): place it in the next frame, before it is painted, and report
                // it open only then, so effects can focus its content.
                requestAnimationFrame(() => {
                    place();
                    setOpen(true);
                });
                window.addEventListener('resize', place);
                window.addEventListener('scroll', place, true);
            } else {
                setOpen(false);
                stopFollowing();
                // Hidden by CSS until it is placed again (`:not([data-side])`), so it never shows
                // at its default place for a frame.
                delete popover.dataset.side;
            }
        };
        popover.addEventListener('beforetoggle', handleBeforeToggle);
        return () => {
            popover.removeEventListener('beforetoggle', handleBeforeToggle);
            stopFollowing();
        };
    }, [anchorRef, popoverRef, side, align]);
    return open;
};
