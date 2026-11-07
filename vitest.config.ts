import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    projects: [
      { test: { name: 'tools', environment: 'node', include: ['tools/**/*.test.mjs'] } },
      // 'packages/core' is added in P03-S01, 'apps/web' in P04-S01
    ],
  },
});
