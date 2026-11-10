import type { SourceFile } from '../analysis/analyzeProject';
import { excludedFolders } from '../model/files';

/** What a folder upload delivers: source files for the analysis, config files for resolving imports. */
export type ProjectFiles = { sources: SourceFile[]; configs: SourceFile[] };

/**
 * The legacy exclusions, Python environments, whose packages break the parser (ADR-011 A18), and
 * test folders (A19).
 */
const skippedFolders = [...excludedFolders, '/.venv/', '/__tests__/'];

const configFileName = /^(package\.json|[jt]sconfig.*\.json)$/;

const isPythonProjectFile = (name: string) =>
    name.endsWith('.py') || name === 'pyproject.toml' || name === 'uv.lock';

/**
 * True for a folder path the upload does not descend into (node_modules, build, dist, .venv,
 * __tests__), and for every path inside one.
 */
export const isExcludedFolder = (folderPath: string): boolean => {
    // A slash on both ends lets '/dist/' match the folder '…/dist' and a path without a leading slash.
    const path = `/${folderPath}/`;
    return skippedFolders.some(folder => path.includes(folder));
};

/**
 * Folders named 'python' with a .py file, a pyproject.toml or a uv.lock at any depth below them,
 * sorted. The upload leaves them out with everything inside (ADR-011 A19): a Python app there may
 * hold a built frontend, e.g. 'python/app/assets/worker-1a2b.js'. Needs all paths of the upload,
 * not only the source files.
 */
export const findPythonFolders = (paths: readonly string[]): string[] => {
    const folders = new Set<string>();
    for (const path of paths) {
        const parts = path.split('/');
        if (!isPythonProjectFile(parts[parts.length - 1])) {
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

/** package.json, tsconfig*.json, jsconfig*.json outside the excluded folders. */
export const isConfigFile = (path: string): boolean => {
    const slash = path.lastIndexOf('/');
    return configFileName.test(path.slice(slash + 1)) && !isExcludedFolder(path.slice(0, slash));
};
