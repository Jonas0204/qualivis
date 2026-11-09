import { afterEach, describe, expect, it, vi } from 'vitest';
import { suppressNextClick, svgPoint, trackPointer } from './pointerGesture';

const pointer = (type: string, pointerId: number, clientX = 0) =>
    new PointerEvent(type, { pointerId, clientX, bubbles: true, cancelable: true });

describe('trackPointer', () => {
    it('follows only its pointer and stops on release', () => {
        const move = vi.fn();
        const end = vi.fn();
        trackPointer(window, 7, { move, end });

        window.dispatchEvent(pointer('pointermove', 8, 5));
        window.dispatchEvent(pointer('pointermove', 7, 10));
        window.dispatchEvent(pointer('pointerup', 7, 10));
        window.dispatchEvent(pointer('pointermove', 7, 20));

        expect(move.mock.calls.map(([event]) => event.clientX)).toEqual([10]);
        expect(end).toHaveBeenCalledTimes(1);
    });

    it('ends on cancel too and can be stopped early', () => {
        const end = vi.fn();
        trackPointer(window, 1, { move: () => {}, end });
        window.dispatchEvent(pointer('pointercancel', 1));
        expect(end.mock.calls[0]?.[0].type).toBe('pointercancel');

        const move = vi.fn();
        const stop = trackPointer(window, 2, { move, end });
        stop();
        window.dispatchEvent(pointer('pointermove', 2));
        expect(move).not.toHaveBeenCalled();
    });
});

describe('suppressNextClick', () => {
    afterEach(() => {
        vi.useRealTimers();
    });

    it('swallows the click right after the gesture, but not later ones', () => {
        vi.useFakeTimers();
        const onClick = vi.fn();
        document.body.addEventListener('click', onClick);

        suppressNextClick(window);
        const swallowed = new MouseEvent('click', { bubbles: true, cancelable: true });
        document.body.dispatchEvent(swallowed);
        vi.runAllTimers();
        document.body.dispatchEvent(new MouseEvent('click', { bubbles: true }));

        expect(swallowed.defaultPrevented).toBe(true);
        expect(onClick).toHaveBeenCalledTimes(1);
        document.body.removeEventListener('click', onClick);
    });
});

describe('svgPoint', () => {
    it('measures from the top left corner of the element', () => {
        const element = document.createElement('div');
        element.getBoundingClientRect = () => ({ left: 50, top: 20 }) as DOMRect;

        expect(svgPoint(element, { clientX: 70, clientY: 25 })).toEqual({ x: 20, y: 5 });
    });
});
