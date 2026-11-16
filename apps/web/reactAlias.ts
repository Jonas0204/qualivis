import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const packageDir = (name: string) =>
    dirname(fileURLToPath(import.meta.resolve(`${name}/package.json`)));

/**
 * common-components/ is no package and has no node_modules: its imports of React resolve to this
 * app's install (common-components/README.md).
 */
export const reactAlias = { react: packageDir('react'), 'react-dom': packageDir('react-dom') };
