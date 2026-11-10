import { isComponentFile, type SourceFile } from '@qualivis/core';
import { isIgnoredUploadPath } from './isIgnoredUploadPath';

/**
 * Reads the component files of a folder selection; paths are `'/' + webkitRelativePath` like the
 * legacy app. Like the legacy app (data.service.ts:31), only files that `isComponentFile` accepts
 * are read; the core filters with the same function. Unlike the legacy app, files in `.venv`
 * folders are skipped (ADR-011 A18).
 */
export const readInputFiles = (files: FileList | File[]): Promise<SourceFile[]> =>
    Promise.all(
        Array.from(files, file => ({ file, path: `/${file.webkitRelativePath}` }))
            .filter(({ path }) => !isIgnoredUploadPath(path) && isComponentFile({ path }))
            .map(async ({ file, path }) => ({ path, code: await file.text() }))
    );
