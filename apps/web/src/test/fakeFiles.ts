// jsdom has no File System API and no real drag data. These fakes implement only what the upload
// code reads; the casts keep the fakes small instead of stubbing every DOM member.

/** A `File` with `webkitRelativePath`, as a folder selection delivers it. */
export const fileWithRelativePath = (relativePath: string, code: string): File => {
  const file = new File([code], relativePath.split('/').at(-1) ?? relativePath);
  Object.defineProperty(file, 'webkitRelativePath', { value: relativePath });
  return file;
};

const nameOf = (fullPath: string) => fullPath.split('/').at(-1) ?? fullPath;

export const fakeFileEntry = (fullPath: string, code: string): FileSystemEntry =>
  ({
    isFile: true,
    isDirectory: false,
    name: nameOf(fullPath),
    fullPath,
    file: (success: (file: File) => void) =>
      queueMicrotask(() => success(new File([code], nameOf(fullPath)))),
  }) as unknown as FileSystemEntry;

/** Directory whose reader returns at most `batchSize` entries per call, like Chromium (100). */
export const fakeDirectoryEntry = (
  fullPath: string,
  children: readonly FileSystemEntry[],
  batchSize = 100
): FileSystemEntry =>
  ({
    isFile: false,
    isDirectory: true,
    name: nameOf(fullPath),
    fullPath,
    createReader: () => {
      let offset = 0;
      return {
        readEntries: (success: (entries: FileSystemEntry[]) => void) => {
          const batch = children.slice(offset, offset + batchSize);
          offset += batch.length;
          queueMicrotask(() => success(batch));
        },
      };
    },
  }) as unknown as FileSystemEntry;

export const entryItem = (entry: FileSystemEntry): DataTransferItem =>
  ({
    kind: 'file',
    webkitGetAsEntry: () => entry,
    getAsFile: () => null,
  }) as unknown as DataTransferItem;

/** Item of a browser without `webkitGetAsEntry`. */
export const fileItem = (file: File): DataTransferItem =>
  ({ kind: 'file', getAsFile: () => file }) as unknown as DataTransferItem;

export const stringItem = (): DataTransferItem =>
  ({
    kind: 'string',
    webkitGetAsEntry: () => null,
    getAsFile: () => null,
  }) as unknown as DataTransferItem;

export const fakeDataTransfer = (items: readonly DataTransferItem[]): DataTransfer =>
  ({ items }) as unknown as DataTransfer;
