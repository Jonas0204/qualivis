import type { ProjectFiles } from '@qualivis/core';
import { isUploadFile, toProjectFiles } from './toProjectFiles';

/**
 * Reads the source and config files of a folder selection; paths are `'/' + webkitRelativePath`
 * like the legacy app. Other files are not read. The browser lists the files of excluded folders
 * anyway; that cannot be prevented here (RI15).
 */
export const readInputFiles = async (files: FileList | File[]): Promise<ProjectFiles> =>
    toProjectFiles(
        await Promise.all(
            Array.from(files, file => ({ file, path: `/${file.webkitRelativePath}` }))
                .filter(({ path }) => isUploadFile(path))
                .map(async ({ file, path }) => ({ path, code: await file.text() }))
        )
    );
