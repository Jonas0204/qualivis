// Copied from legacy/angular/src/app/interfaces.ts (fields unchanged, `interface` → `type`).
import type { File as BabelFile } from '@babel/types';
import type { Graph } from './graph';
import type { NodeKind } from './types';

export type FileMap = {
    [fileName: string]: {
        components?: ComponentMap;
        defaultExport?: string;
        code: string;
    };
};

export type ComponentMap = {
    [componentName: string]: Component;
};

export type Component = {
    graph?: Graph;
    extends?: Import;
    dependencies?: Import[];
    lineStart?: number;
    lineEnd?: number;
    kind?: NodeKind;
};

export type AstWithPath = {
    ast: BabelFile;
    srcPath: string;
};

export type Import = {
    name: string;
    source: string;
};

/**
 * Tree of the uploaded files (legacy extractFileTree). Unused until the file tree comes back.
 * @public
 */
export type FileTree = {
    name: string;
    id?: string;
    type: 'file' | 'folder';
    children?: FileTree[];
};
