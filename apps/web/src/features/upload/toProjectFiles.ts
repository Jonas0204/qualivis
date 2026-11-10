import {
    isComponentFile,
    isConfigFile,
    isExcludedFolder,
    type ProjectFiles,
    type SourceFile,
} from '@qualivis/core';

// Like the legacy app (data.service.ts:31), sources are the files `isComponentFile` accepts; the core
// filters with the same function. Files in a `.venv` folder are left out as well (ADR-011 A18).
const isSource = (path: string) => !isExcludedFolder(path) && isComponentFile({ path }) === true;

/** True for a file the upload reads: a source file for the analysis or a config file (ADR-019). */
export const isUploadFile = (path: string): boolean => isSource(path) || isConfigFile(path);

/** Splits read files into sources and configs, keeping their order. */
export const toProjectFiles = (files: readonly SourceFile[]): ProjectFiles => ({
    sources: files.filter(file => isSource(file.path)),
    configs: files.filter(file => isConfigFile(file.path)),
});
