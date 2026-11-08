// Copied from legacy/angular/src/app/constants/files.ts.
export const supportedExtensions = ['tsx', 'jsx', 'ts', 'js'];

export const excludedFolders = ['/node_modules/', '/build/', '/dist/'];

/**
 * DOM-free stand-in for the legacy `FileWithPath` (helper/getFilesAsync.ts), which extends the
 * DOM `File`. The analysis helpers only read `.path`.
 */
export type FileWithPath = { path: string };
