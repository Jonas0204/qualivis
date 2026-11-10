import { renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { useStableHandlers } from './useStableHandlers';

describe('useStableHandlers', () => {
    it('returns the same object, which calls the handlers of the latest render', () => {
        const first = vi.fn(() => 'first');
        const second = vi.fn(() => 'second');
        const { result, rerender } = renderHook(
            ({ onClick }: { onClick: (value: number) => string }) => useStableHandlers({ onClick }),
            { initialProps: { onClick: first } }
        );
        const stable = result.current;

        expect(stable.onClick(1)).toBe('first');
        rerender({ onClick: second });

        expect(result.current).toBe(stable);
        expect(stable.onClick(2)).toBe('second');
        expect(first).toHaveBeenCalledWith(1);
        expect(second).toHaveBeenCalledWith(2);
    });

    it('calls nothing when the latest render left the handler out', () => {
        const { result, rerender } = renderHook(
            ({ onClick }: { onClick?: () => void }) => useStableHandlers({ onClick }),
            { initialProps: { onClick: vi.fn() as (() => void) | undefined } }
        );

        rerender({ onClick: undefined });

        expect(result.current.onClick?.()).toBeUndefined();
    });
});
