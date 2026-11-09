import type { SourceFile } from '@qualivis/core';

/** Reads the files of a folder selection; paths are `'/' + webkitRelativePath` like the legacy app. */
export const readInputFiles = (files: FileList | File[]): Promise<SourceFile[]> =>
  Promise.all(
    Array.from(files, async file => ({
      path: `/${file.webkitRelativePath}`,
      code: await file.text(),
    }))
  );
