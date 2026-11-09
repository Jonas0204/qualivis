import { describe, expect, it } from 'vitest';
import { isColliding, type Rect } from './isColliding';

const rect = (x: number, y: number, width = 10, height = 10): Rect => ({ x, y, width, height });

describe('isColliding', () => {
    it('is true for overlapping rectangles, in both orders', () => {
        expect(isColliding(rect(0, 0), rect(5, 5))).toBe(true);
        expect(isColliding(rect(5, 5), rect(0, 0))).toBe(true);
    });

    it('is true when one rectangle lies inside the other', () => {
        expect(isColliding(rect(0, 0, 100, 100), rect(40, 40))).toBe(true);
    });

    it('is false for rectangles that only touch', () => {
        expect(isColliding(rect(0, 0), rect(10, 0))).toBe(false);
        expect(isColliding(rect(0, 0), rect(0, 10))).toBe(false);
    });

    it('is false when the rectangles overlap on one axis only', () => {
        expect(isColliding(rect(0, 0), rect(5, 20))).toBe(false);
        expect(isColliding(rect(0, 0), rect(20, 5))).toBe(false);
    });

    it('is false for empty rectangles, as hidden elements measure', () => {
        expect(isColliding(rect(0, 0, 0, 0), rect(0, 0, 0, 0))).toBe(false);
    });
});
