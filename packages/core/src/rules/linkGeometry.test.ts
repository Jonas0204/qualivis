import { describe, expect, it } from 'vitest';
import { linkEnd } from './linkGeometry';

describe('linkEnd', () => {
    it('ends the link at the outer edge of the target stroke (main radius + 0.5)', () => {
        expect(linkEnd({ x: 0, y: 0 }, { x: 100, y: 0 }, 24)).toEqual({ x: 75.5, y: 0 });
    });

    it('shortens along the direction of the link', () => {
        const end = linkEnd({ x: 10, y: 10 }, { x: 40, y: 50 }, 24.5);

        expect(end.x).toBeCloseTo(25);
        expect(end.y).toBeCloseTo(30);
    });

    it('gives NaN like the legacy code when source and target are at the same place', () => {
        const end = linkEnd({ x: 5, y: 5 }, { x: 5, y: 5 }, 24);

        expect(end.x).toBeNaN();
        expect(end.y).toBeNaN();
    });
});
