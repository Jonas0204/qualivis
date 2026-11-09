import { isComponentFile, type SourceFile } from '@qualivis/core';

/**
 * Reads the component files of a folder selection; paths are `'/' + webkitRelativePath` like the
 * legacy app. Like the legacy app (data.service.ts:31), only files that `isComponentFile` accepts
 * are read; the core filters with the same function, so the analysis result is unchanged.
 */
export const readInputFiles = (files: FileList | File[]): Promise<SourceFile[]> =>
  Promise.all(
    Array.from(files, file => ({ file, path: `/${file.webkitRelativePath}` }))
      .filter(({ path }) => isComponentFile({ path }))
      .map(async ({ file, path }) => ({ path, code: await file.text() }))
  );
