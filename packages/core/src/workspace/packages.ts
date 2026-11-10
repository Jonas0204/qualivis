import posix from 'path-browserify';
import type { SourceFile } from '../analysis/analyzeProject';
import { readConfigFile } from './jsonc';

export type WorkspacePackage = {
    /** Folder of the package.json, e.g. '/repo/shared/ui'. */
    dir: string;
    name?: string;
    /** Entry fields as written in the package.json, relative to dir. */
    entries: { source?: string; module?: string; main?: string };
};

const entryFields = ['source', 'module', 'main'] as const;

const toPackage = (path: string, json: Record<string, unknown>): WorkspacePackage => {
    const entries: WorkspacePackage['entries'] = {};
    for (const field of entryFields) {
        const value = json[field];
        if (typeof value === 'string') {
            entries[field] = value;
        }
    }
    const dir = posix.dirname(path);
    return typeof json.name === 'string' ? { dir, name: json.name, entries } : { dir, entries };
};

/**
 * One entry per package.json among the configs, sorted by dir; a root package.json with
 * workspaces counts as well. Invalid JSON: console.warn, skipped.
 */
export const findPackages = (configs: readonly SourceFile[]): WorkspacePackage[] =>
    configs
        .filter(file => file.path.endsWith('/package.json'))
        .flatMap(file => {
            const json = readConfigFile(file);
            return json ? [toPackage(file.path, json)] : [];
        })
        // Plain code-unit comparison, like sortFiles (ADR-006).
        .sort((a, b) => (a.dir < b.dir ? -1 : a.dir > b.dir ? 1 : 0));
