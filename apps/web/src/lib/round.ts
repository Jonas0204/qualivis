/** Rounds to two decimals: enough for milliseconds and far below a pixel at any zoom. */
export const round = (value: number): number => Math.round(value * 100) / 100;
