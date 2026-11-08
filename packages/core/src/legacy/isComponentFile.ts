// @ts-nocheck -- legacy code copied 1:1 from legacy/angular; typed in P03-S06

import type { FileWithPath } from '../model/files';
import { excludedFolders, supportedExtensions } from '../model/files';

export function isComponentFile(file: FileWithPath): boolean {
  if (excludedFolders.some(folder => file.path.includes(folder))) {
    return;
  }

  const fileParts = file.path.split('.');
  return (
    fileParts.length >= 2 &&
    fileParts[fileParts.length - 2] !== 'test' &&
    supportedExtensions.includes(fileParts[fileParts.length - 1])
  );
}
