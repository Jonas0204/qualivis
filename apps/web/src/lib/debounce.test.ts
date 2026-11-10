import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { debounce } from './debounce';

describe('debounce', () => {
    beforeEach(() => {
        vi.useFakeTimers();
    });
    afterEach(() => {
        vi.useRealTimers();
    });

    it('calls once, wait ms after the last call', () => {
        const fn = vi.fn();
        const debounced = debounce(fn, 250);

        debounced();
        vi.advanceTimersByTime(200);
        debounced();
        vi.advanceTimersByTime(200);
        expect(fn).not.toHaveBeenCalled();

        vi.advanceTimersByTime(50);
        expect(fn).toHaveBeenCalledTimes(1);
    });

    it('calls again for a call after the wait', () => {
        const fn = vi.fn();
        const debounced = debounce(fn, 250);

        debounced();
        vi.advanceTimersByTime(250);
        debounced();
        vi.advanceTimersByTime(250);
        expect(fn).toHaveBeenCalledTimes(2);
    });

    it('drops a pending call on cancel', () => {
        const fn = vi.fn();
        const debounced = debounce(fn, 250);

        debounced();
        debounced.cancel();
        vi.advanceTimersByTime(500);
        expect(fn).not.toHaveBeenCalled();
    });
});
