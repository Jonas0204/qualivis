import type { SourceFile } from '../analysis/analyzeProject';
import { excludedFolders } from '../model/files';

/** What a folder upload delivers: source files for the analysis, config files for resolving imports. */
export type ProjectFiles = { sources: SourceFile[]; configs: SourceFile[] };

/** The legacy exclusions and Python environments, whose packages break the parser (ADR-011 A18). */
const skippedFolders = [...excludedFolders, '/.venv/'];

const configFileName = /^(package\.json|[jt]sconfig.*\.json)$/;

/**
 * True for a folder path the upload does not descend into (node_modules, build, dist, .venv), and
 * for every path inside one.
 */
export const isExcludedFolder = (folderPath: string): boolean => {
    // A slash on both ends lets '/dist/' match the folder '…/dist' and a path without a leading slash.
    const path = `/${folderPath}/`;
    return skippedFolders.some(folder => path.includes(folder));
};

/** package.json, tsconfig*.json, jsconfig*.json outside the excluded folders. */
export const isConfigFile = (path: string): boolean => {
    const slash = path.lastIndexOf('/');
    return configFileName.test(path.slice(slash + 1)) && !isExcludedFolder(path.slice(0, slash));
};
