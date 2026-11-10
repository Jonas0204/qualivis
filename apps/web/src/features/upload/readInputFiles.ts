import type { ProjectFiles } from '@qualivis/core';
import { toProjectFiles, uploadFileFilter } from './toProjectFiles';

/**
 * Reads the source and config files of a folder selection; paths are `'/' + webkitRelativePath`
 * like the legacy app. Other files are not read. The browser lists the files of excluded folders
 * anyway; that cannot be prevented here (RI15).
 */
export const readInputFiles = async (files: FileList | File[]): Promise<ProjectFiles> => {
    const selection = Array.from(files, file => ({ file, path: `/${file.webkitRelativePath}` }));
    const isRead = uploadFileFilter(selection.map(({ path }) => path));
    return toProjectFiles(
        await Promise.all(
            selection
                .filter(({ path }) => isRead(path))
                .map(async ({ file, path }) => ({ path, code: await file.text() }))
        )
    );
};
