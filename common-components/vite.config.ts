// Vite config of the showcase. It runs with the web app's Vite (`pnpm showcase`), as this folder is
// no package and has no node_modules of its own.
import { createRequire } from 'node:module';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const fromWebApp = createRequire(new URL('../apps/web/package.json', import.meta.url));
const packageDir = (name: string) => dirname(fromWebApp.resolve(`${name}/package.json`));

export default {
    root: fileURLToPath(new URL('./showcase', import.meta.url)),
    resolve: {
        // Imports of React from this folder resolve to the web app's install.
        alias: { react: packageDir('react'), 'react-dom': packageDir('react-dom') },
    },
    server: { host: '127.0.0.1', port: 5174, strictPort: true },
    preview: { host: '127.0.0.1', port: 4174, strictPort: true },
};
