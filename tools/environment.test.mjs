import { describe, expect, it } from 'vitest';

describe('development environment', () => {
  it('runs on Node.js 24 or newer', () => {
    expect(Number(process.versions.node.split('.')[0])).toBeGreaterThanOrEqual(24);
  });
});
