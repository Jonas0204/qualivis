import { isComponentFile, type SourceFile } from '@qualivis/core';

const isFileEntry = (entry: FileSystemEntry): entry is FileSystemFileEntry => entry.isFile;

const isDirectoryEntry = (entry: FileSystemEntry): entry is FileSystemDirectoryEntry =>
    entry.isDirectory;

const getFile = (entry: FileSystemFileEntry) =>
    new Promise<File>((resolve, reject) => entry.file(resolve, reject));

const readEntriesOnce = (reader: FileSystemDirectoryReader) =>
    new Promise<FileSystemEntry[]>((resolve, reject) => reader.readEntries(resolve, reject));

// Chromium returns at most 100 entries per readEntries call; the legacy app called it only once
// and lost files in large folders (ADR-011 A7). Read until an empty batch arrives.
const readAllEntries = async (reader: FileSystemDirectoryReader) => {
    const entries: FileSystemEntry[] = [];
    let batch: FileSystemEntry[];
    do {
        batch = await readEntriesOnce(reader);
        entries.push(...batch);
    } while (batch.length > 0);
    return entries;
};

const readEntry = async (entry: FileSystemEntry): Promise<SourceFile[]> => {
    if (isFileEntry(entry)) {
        if (!isComponentFile({ path: entry.fullPath })) {
            return [];
        }
        const file = await getFile(entry);
        return [{ path: entry.fullPath, code: await file.text() }];
    }
    if (isDirectoryEntry(entry)) {
        const children = await readAllEntries(entry.createReader());
        const nested = await Promise.all(children.map(readEntry));
        return nested.flat();
    }
    return [];
};

const readFile = async (file: File, path: string): Promise<SourceFile> => ({
    path,
    code: await file.text(),
});

/**
 * Reads dropped files and folders (recursively) like the legacy `getFilesAsync`: entry paths are
 * `entry.fullPath`, the fallback without `webkitGetAsEntry` uses `file.webkitRelativePath`.
 * Fallback files come first, then the entries in item order; the core sorts them later.
 * Like the legacy app (data.service.ts:31), only files that `isComponentFile` accepts are read; the
 * core filters with the same function, so the analysis result is unchanged.
 */
export const readDroppedFiles = async (dataTransfer: DataTransfer): Promise<SourceFile[]> => {
    // Items are only readable during the drop event, so collect everything before the first await.
    const fallbackReads: Promise<SourceFile>[] = [];
    const entryReads: Promise<SourceFile[]>[] = [];

    for (const item of Array.from(dataTransfer.items)) {
        if (item.kind !== 'file') {
            continue;
        }
        if (typeof item.webkitGetAsEntry === 'function') {
            const entry = item.webkitGetAsEntry();
            if (entry) {
                entryReads.push(readEntry(entry));
            }
            continue;
        }
        const file = item.getAsFile();
        if (file && isComponentFile({ path: file.webkitRelativePath })) {
            fallbackReads.push(readFile(file, file.webkitRelativePath));
        }
    }

    const fallbackFiles = await Promise.all(fallbackReads);
    const entryFiles = await Promise.all(entryReads);
    return [...fallbackFiles, ...entryFiles.flat()];
};
