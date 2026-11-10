import { isComponentFile } from '@qualivis/core';

const ignoredFolders = ['.venv', '__tests__'];

const isPythonProjectFile = (name: string) =>
    name.endsWith('.py') || name === 'pyproject.toml' || name === 'uv.lock';

/**
 * True for a file or folder path inside a Python virtual environment (`.venv`) or a test folder
 * (`__tests__`). The `.venv` packages ship `.d.ts` files (e.g. Playwright) that the legacy parser
 * rejects, which failed the whole analysis; the upload skips them instead (ADR-011 A18). Test
 * folders do not belong in the graph (A19).
 */
export const isIgnoredUploadPath = (path: string): boolean =>
    path.split('/').some(part => ignoredFolders.includes(part));

/**
 * Folders named 'python' with a .py file, a pyproject.toml or a uv.lock at any depth below them,
 * sorted. The upload leaves them out with everything inside (ADR-011 A19): a Python app there may
 * hold a built frontend, e.g. 'python/app/assets/worker-1a2b.js'. Needs all paths of the upload,
 * not only the component files.
 */
export const findPythonFolders = (paths: readonly string[]): string[] => {
    const folders = new Set<string>();
    for (const path of paths) {
        const parts = path.split('/');
        if (!isPythonProjectFile(parts.at(-1) ?? '')) {
            continue;
        }
        for (let i = 0; i < parts.length - 1; i++) {
            if (parts[i] === 'python') {
                folders.add(parts.slice(0, i + 1).join('/'));
            }
        }
    }
    return [...folders].sort();
};

/**
 * Decides from all paths of an upload which files it reads: the component files outside ignored
 * folders and outside python folders with a Python project (ADR-011 A18, A19).
 */
export const uploadFileFilter = (paths: readonly string[]): ((path: string) => boolean) => {
    const pythonFolders = findPythonFolders(paths);
    return path =>
        !isIgnoredUploadPath(path) &&
        isComponentFile({ path }) === true &&
        !pythonFolders.some(folder => path.startsWith(`${folder}/`));
};
