import { describe, expect, it } from 'vitest';
import { fitViewBox } from './geometry';

describe('fitViewBox', () => {
    it('spans all nodes plus a margin of 48 px', () => {
        const nodes = [
            { x: 0, y: 10 },
            { x: 200, y: -40 },
            { x: 50, y: 100 },
        ];

        expect(fitViewBox(nodes)).toBe('-48 -88 296 236');
    });

    it('falls back to a unit box without placed nodes', () => {
        expect(fitViewBox([])).toBe('0 0 1 1');
        expect(
            fitViewBox([
                { x: undefined, y: undefined },
                { x: Number.NaN, y: 0 },
            ])
        ).toBe('0 0 1 1');
    });
});
