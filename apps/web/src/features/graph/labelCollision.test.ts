import { describe, expect, it } from 'vitest';
import { hiddenLabels, type LabelRect } from './labelCollision';

const label = (id: string, x: number, y = 0): LabelRect => ({
    id,
    rect: { x, y, width: 40, height: 14 },
});

describe('hiddenLabels', () => {
    it('hides the two earlier of three overlapping labels', () => {
        expect(hiddenLabels([label('a', 0), label('b', 10), label('c', 20)])).toEqual(
            new Set(['a', 'b'])
        );
    });

    it('hides nothing without overlaps', () => {
        expect(hiddenLabels([label('a', 0), label('b', 50), label('c', 0, 20)])).toEqual(new Set());
        expect(hiddenLabels([])).toEqual(new Set());
    });

    it('hides the earlier label of every overlapping pair in a chain', () => {
        // b overlaps a and c, but a and c are apart: a goes for b, b goes for c.
        expect(hiddenLabels([label('a', 0), label('b', 30), label('c', 60)])).toEqual(
            new Set(['a', 'b'])
        );
    });

    it('compares each label with the earlier ones only', () => {
        // c is far away; a and b overlap, so a goes and b stays.
        expect(hiddenLabels([label('a', 0), label('b', 20), label('c', 200)])).toEqual(
            new Set(['a'])
        );
    });
});
