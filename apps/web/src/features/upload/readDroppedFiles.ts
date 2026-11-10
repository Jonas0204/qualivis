import type { SourceFile } from '@qualivis/core';
import { isIgnoredUploadPath, uploadFileFilter } from './isIgnoredUploadPath';

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

/** All file entries below a dropped entry, without entering ignored folders. */
const listFiles = async (entry: FileSystemEntry): Promise<FileSystemFileEntry[]> => {
    if (isIgnoredUploadPath(entry.fullPath)) {
        return [];
    }
    if (isFileEntry(entry)) {
        return [entry];
    }
    if (isDirectoryEntry(entry)) {
        const children = await readAllEntries(entry.createReader());
        const nested = await Promise.all(children.map(listFiles));
        return nested.flat();
    }
    return [];
};

const readEntryFile = async (entry: FileSystemFileEntry): Promise<SourceFile> => ({
    path: entry.fullPath,
    code: await (await getFile(entry)).text(),
});

const readFile = async (file: File, path: string): Promise<SourceFile> => ({
    path,
    code: await file.text(),
});

/**
 * Reads dropped files and folders (recursively) like the legacy `getFilesAsync`: entry paths are
 * `entry.fullPath`, the fallback without `webkitGetAsEntry` uses `file.webkitRelativePath`.
 * Fallback files come first, then the entries in item order; the core sorts them later.
 * Like the legacy app (data.service.ts:31), only files that `isComponentFile` accepts are read; the
 * core filters with the same function. Unlike the legacy app, `.venv` and `__tests__` folders
 * are not entered, and a python folder with a Python project is listed but nothing in it is read
 * (ADR-011 A18, A19).
 */
export const readDroppedFiles = async (dataTransfer: DataTransfer): Promise<SourceFile[]> => {
    // Items are only readable during the drop event, so collect everything before the first await.
    const fallbackFiles: File[] = [];
    const entryLists: Promise<FileSystemFileEntry[]>[] = [];

    for (const item of Array.from(dataTransfer.items)) {
        if (item.kind !== 'file') {
            continue;
        }
        if (typeof item.webkitGetAsEntry === 'function') {
            const entry = item.webkitGetAsEntry();
            if (entry) {
                entryLists.push(listFiles(entry));
            }
            continue;
        }
        const file = item.getAsFile();
        if (file) {
            fallbackFiles.push(file);
        }
    }

    const entries = (await Promise.all(entryLists)).flat();
    // Python folders are known only once every path is listed, so reading starts afterwards.
    const isRead = uploadFileFilter([
        ...fallbackFiles.map(file => file.webkitRelativePath),
        ...entries.map(entry => entry.fullPath),
    ]);
    return Promise.all([
        ...fallbackFiles
            .filter(file => isRead(file.webkitRelativePath))
            .map(file => readFile(file, file.webkitRelativePath)),
        ...entries.filter(entry => isRead(entry.fullPath)).map(readEntryFile),
    ]);
};
