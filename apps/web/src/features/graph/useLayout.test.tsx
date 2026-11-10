import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { LayoutEngine } from './layout/types';
import { type FrameHandler, useLayout } from './useLayout';

/** Engine that ticks and ends when the test says so. */
const createEngine = () => {
    const ticks = new Set<() => void>();
    const ends = new Set<() => void>();
    const engine: LayoutEngine = {
        start: () => undefined,
        stop: () => undefined,
        onTick: listener => {
            ticks.add(listener);
            return () => ticks.delete(listener);
        },
        onEnd: listener => {
            ends.add(listener);
            return () => ends.delete(listener);
        },
        dragStart: () => undefined,
        drag: () => undefined,
        dragEnd: () => undefined,
    };
    const tick = () => {
        for (const listener of ticks) {
            listener();
        }
    };
    const end = () => {
        for (const listener of ends) {
            listener();
        }
    };
    return { engine, tick, end };
};

const nextFrame = () => {
    act(() => {
        vi.advanceTimersByTime(20);
    });
};

describe('useLayout', () => {
    beforeEach(() => {
        vi.useFakeTimers({ toFake: ['requestAnimationFrame', 'cancelAnimationFrame'] });
    });
    afterEach(() => {
        vi.useRealTimers();
    });

    it('renders once per frame of ticks without a frame handler', () => {
        const { engine, tick } = createEngine();
        const { result } = renderHook(() => useLayout(() => engine, []));
        const before = result.current.version;

        tick();
        tick();
        nextFrame();

        expect(result.current.version).toBe(before + 1);
    });

    it('leaves the frames to the frame handler and renders only when it cannot move the graph', () => {
        const { engine, tick, end } = createEngine();
        const onFrame = vi.fn<FrameHandler>(() => true);
        const { result } = renderHook(() => useLayout(() => engine, [], onFrame));
        const before = result.current.version;

        tick();
        tick();
        nextFrame();
        expect(onFrame).toHaveBeenCalledTimes(1);
        expect(result.current.version).toBe(before);

        onFrame.mockReturnValue(false);
        tick();
        nextFrame();
        expect(result.current.version).toBe(before + 1);

        // The end always renders, so that React has the final positions.
        onFrame.mockReturnValue(true);
        act(() => end());
        expect(result.current).toMatchObject({ version: before + 2, ended: true, ends: 1 });
    });
});
