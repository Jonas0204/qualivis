import { describe, expect, it } from 'vitest';
import { fitViewBox, shortenToTarget } from './geometry';

describe('shortenToTarget', () => {
  it('ends the link the radius before the target centre', () => {
    expect(shortenToTarget({ x: 0, y: 0 }, { x: 100, y: 0 }, 24.5)).toEqual({ x: 75.5, y: 0 });
  });

  it('shortens along the direction of the link', () => {
    const end = shortenToTarget({ x: 10, y: 10 }, { x: 40, y: 50 }, 25);

    expect(end.x).toBeCloseTo(25);
    expect(end.y).toBeCloseTo(30);
  });
});

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
