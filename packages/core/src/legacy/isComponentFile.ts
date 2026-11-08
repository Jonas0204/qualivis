import type { FileWithPath } from '../model/files';
import { excludedFolders, supportedExtensions } from '../model/files';

export function isComponentFile(file: FileWithPath): boolean | undefined {
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
