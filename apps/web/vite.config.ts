import { fileURLToPath } from 'node:url';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  base: './',
  plugins: [react()],
  resolve: {
    // Patched legacy deps still require('path'); give them the same POSIX module (ADR-005).
    alias: { path: fileURLToPath(import.meta.resolve('path-browserify')) },
  },
  optimizeDeps: {
    // Babel reads process.env flags when it loads. The build replaces process.env with {}, but
    // the dev pre-bundling only replaces process.env.NODE_ENV; give it the same define.
    rolldownOptions: { transform: { define: { 'process.env': '{}' } } },
  },
  server: { host: '127.0.0.1', port: 5173, strictPort: true },
  preview: { host: '127.0.0.1', port: 4173, strictPort: true },
  build: { target: 'es2023', sourcemap: true },
});
