import {
    findPythonFolders,
    isComponentFile,
    isConfigFile,
    isExcludedFolder,
    type ProjectFiles,
    type SourceFile,
} from '@qualivis/core';

// Like the legacy app (data.service.ts:31), sources are the files `isComponentFile` accepts; the core
// filters with the same function. Files in a `.venv` or `__tests__` folder are left out as well
// (ADR-011 A18, A19).
const isSource = (path: string) => !isExcludedFolder(path) && isComponentFile({ path }) === true;

/** True for a source file for the analysis or a config file (ADR-019). */
const isUploadFile = (path: string): boolean => isSource(path) || isConfigFile(path);

/**
 * Decides from all paths of an upload which files it reads: source and config files, but none in a
 * folder named python that holds a Python project (ADR-011 A19).
 */
export const uploadFileFilter = (paths: readonly string[]): ((path: string) => boolean) => {
    const pythonFolders = findPythonFolders(paths);
    return path =>
        isUploadFile(path) && !pythonFolders.some(folder => path.startsWith(`${folder}/`));
};

/** Splits read files into sources and configs, keeping their order. */
export const toProjectFiles = (files: readonly SourceFile[]): ProjectFiles => ({
    sources: files.filter(file => isSource(file.path)),
    configs: files.filter(file => isConfigFile(file.path)),
});
