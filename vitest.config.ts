import { defineConfig } from 'vitest/config';

export default defineConfig({
    test: {
        projects: [
            { test: { name: 'tools', environment: 'node', include: ['tools/**/*.test.mjs'] } },
            'packages/core',
            'apps/web',
        ],
    },
});
