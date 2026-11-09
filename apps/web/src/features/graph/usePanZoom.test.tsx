import { act, fireEvent, render } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { type PanZoom, type PanZoomMeasure, type PanZoomOptions, usePanZoom } from './usePanZoom';
import { fitTransform, identityTransform } from './zoomMath';

let panZoom: PanZoom;

const Probe = (options: PanZoomOptions) => {
    panZoom = usePanZoom(options);
    return (
        <svg
            ref={panZoom.svgRef}
            onPointerDown={panZoom.onPointerDown}
            role="img"
            aria-label="graph"
        >
            <g ref={panZoom.zoomGroupRef} />
        </svg>
    );
};

// jsdom has no layout; getBoundingClientRect of the SVG is all zeros, so screen = client point.
const measure: PanZoomMeasure = {
    bounds: () => ({ x: 0, y: 0, width: 200, height: 100 }),
    viewport: () => ({ width: 400, height: 400 }),
};

const draw = (options: PanZoomOptions = {}) => {
    const view = render(<Probe measure={measure} {...options} />);
    return { ...view, svg: view.getByRole('img', { name: 'graph' }) };
};

const wheel = (svg: Element, init: WheelEventInit) => {
    const event = new WheelEvent('wheel', { bubbles: true, cancelable: true, ...init });
    act(() => {
        svg.dispatchEvent(event);
    });
    return event;
};

const pan = (svg: Element, from: [number, number], to: [number, number], init = {}) => {
    fireEvent.pointerDown(svg, { pointerId: 1, clientX: from[0], clientY: from[1], ...init });
    fireEvent.pointerMove(window, { pointerId: 1, clientX: to[0], clientY: to[1] });
    fireEvent.pointerUp(window, { pointerId: 1, clientX: to[0], clientY: to[1] });
};

describe('usePanZoom', () => {
    beforeEach(() => {
        vi.useFakeTimers({ toFake: ['requestAnimationFrame', 'cancelAnimationFrame'] });
    });
    afterEach(() => {
        vi.useRealTimers();
    });

    it('zooms around the pointer on wheel and keeps the page from scrolling', () => {
        const onZoom = vi.fn();
        const { svg } = draw({ onZoom });

        const event = wheel(svg, { deltaY: -500, clientX: 100, clientY: 50 });

        // Factor 2; the point (100, 50) stays where it is.
        expect(panZoom.transform).toEqual({ k: 2, x: -100, y: -50 });
        expect(panZoom.getTransform()).toBe(panZoom.transform);
        expect(event.defaultPrevented).toBe(true);
        expect(panZoom.transition).toBe(true);
        expect(onZoom).toHaveBeenLastCalledWith({ k: 2, x: -100, y: -50 });
    });

    it('leaves Ctrl+wheel and wheels without a scale change to the browser', () => {
        const { svg } = draw();

        const withCtrl = wheel(svg, { deltaY: -500, ctrlKey: true });
        const sideways = wheel(svg, { deltaX: 100, deltaY: 0 });

        expect(withCtrl.defaultPrevented).toBe(false);
        expect(sideways.defaultPrevented).toBe(false);
        expect(panZoom.transform).toEqual(identityTransform);
        expect(panZoom.transition).toBe(false);
    });

    it('pans with the left button and switches the wheel transition off', () => {
        const { svg } = draw();
        wheel(svg, { deltaY: -500 });

        pan(svg, [100, 100], [130, 90]);

        expect(panZoom.transform).toEqual({ k: 2, x: 30, y: -10 });
        expect(panZoom.transition).toBe(false);
    });

    it('swallows the click after a pan, but not after a pointer down without a move', async () => {
        const { svg } = draw();
        const onClick = vi.fn();
        svg.addEventListener('click', onClick);

        pan(svg, [100, 100], [130, 90]);
        fireEvent.click(svg);
        expect(onClick).not.toHaveBeenCalled();

        await new Promise(resolve => setTimeout(resolve, 0));
        fireEvent.pointerDown(svg, { pointerId: 1, clientX: 5, clientY: 5 });
        fireEvent.pointerUp(window, { pointerId: 1, clientX: 5, clientY: 5 });
        fireEvent.click(svg);
        expect(onClick).toHaveBeenCalledTimes(1);
        expect(panZoom.transform).toEqual({ k: 1, x: 30, y: -10 });
    });

    it('does not pan with another button or with Ctrl', () => {
        const { svg } = draw();

        pan(svg, [100, 100], [130, 90], { button: 2 });
        pan(svg, [100, 100], [130, 90], { ctrlKey: true });

        expect(panZoom.transform).toEqual(identityTransform);
    });

    it('zooms to fit in 250 ms and ends exactly at the fitted transform', () => {
        draw();
        const target = fitTransform(measure.bounds({} as SVGGElement), { width: 400, height: 400 });
        expect(target).toEqual({ k: 1.9, x: 200 - 1.9 * 100, y: 200 - 1.9 * 50 });

        act(() => panZoom.zoomToFit());
        act(() => {
            vi.advanceTimersByTime(100);
        });
        expect(panZoom.transform.k).toBeGreaterThan(1);
        expect(panZoom.transform.k).toBeLessThan(1.9);

        act(() => {
            vi.advanceTimersByTime(200);
        });
        expect(panZoom.transform).toEqual(target);
        expect(vi.getTimerCount()).toBe(0);
    });

    it('zooms to 100 %, centred on the graph', () => {
        draw();

        act(() => panZoom.zoomTo100());
        act(() => {
            vi.advanceTimersByTime(300);
        });

        expect(panZoom.transform).toEqual({ k: 1, x: 100, y: 150 });
    });

    it('has nothing to fit without a drawn graph', () => {
        draw({ measure: { ...measure, bounds: () => ({ x: 0, y: 0, width: 0, height: 0 }) } });

        act(() => panZoom.zoomToFit());

        expect(vi.getTimerCount()).toBe(0);
        expect(panZoom.transform).toEqual(identityTransform);
    });

    it('stops a running zoom to fit on wheel', () => {
        const { svg } = draw();
        act(() => panZoom.zoomToFit());
        act(() => {
            vi.advanceTimersByTime(100);
        });

        wheel(svg, { deltaY: -500 });
        const zoomed = panZoom.transform;
        act(() => {
            vi.advanceTimersByTime(300);
        });

        expect(panZoom.transform).toBe(zoomed);
    });

    it('stops listening when the SVG is gone', () => {
        const onZoom = vi.fn();
        const { svg, unmount } = draw({ onZoom });

        unmount();
        wheel(svg, { deltaY: -500 });

        expect(onZoom).not.toHaveBeenCalled();
    });
});
