import type { SourceFile } from '@qualivis/core';
import { uploadFileFilter } from './isIgnoredUploadPath';

/**
 * Reads the component files of a folder selection; paths are `'/' + webkitRelativePath` like the
 * legacy app. Like the legacy app (data.service.ts:31), only files that `isComponentFile` accepts
 * are read; the core filters with the same function. Unlike the legacy app, files in `.venv` and
 * `__tests__` folders and in python folders with a Python project are skipped (ADR-011 A18, A19).
 */
export const readInputFiles = (files: FileList | File[]): Promise<SourceFile[]> => {
    const selection = Array.from(files, file => ({ file, path: `/${file.webkitRelativePath}` }));
    const isRead = uploadFileFilter(selection.map(({ path }) => path));
    return Promise.all(
        selection
            .filter(({ path }) => isRead(path))
            .map(async ({ file, path }) => ({ path, code: await file.text() }))
    );
};
