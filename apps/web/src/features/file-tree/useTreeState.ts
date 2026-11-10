import type { FileTree } from '@qualivis/core';
import { useCallback, useMemo, useState } from 'react';

/** A visible row of the tree: the legacy FlatNode with the node and its path. */
export type TreeRow = {
    node: FileTree;
    /** Folders: their path from the root (`/mini/src`); files: their id. */
    path: string;
    level: number;
    expandable: boolean;
    expanded: boolean;
};

export type TreeState = {
    rows: TreeRow[];
    toggle: (path: string) => void;
    expand: (path: string) => void;
    collapse: (path: string) => void;
    /** Expands the folders of a file (F7). */
    expandToFile: (fileName: string) => void;
};

const pathOf = (parent: string, node: FileTree) =>
    node.type === 'file' && node.id ? node.id : `${parent}/${node.name}`;

/** Paths of the folders on levels 0 and 1: the legacy tree starts with them expanded (F2). */
const startExpanded = (tree: readonly FileTree[]) => {
    const paths = new Set<string>();
    const visit = (nodes: readonly FileTree[], parent: string, level: number) => {
        for (const node of nodes) {
            const path = pathOf(parent, node);
            if (level <= 1 && node.children?.length) {
                paths.add(path);
            }
            if (level < 1 && node.children) {
                visit(node.children, path, level + 1);
            }
        }
    };
    visit(tree, '', 0);
    return paths;
};

/**
 * Expansion of the file tree (legacy FlatTreeControl of file-tree.component.ts) and its visible
 * rows. A new tree starts again with levels 0 and 1 expanded.
 */
export const useTreeState = (tree: readonly FileTree[]): TreeState => {
    const [state, setState] = useState(() => ({ tree, expanded: startExpanded(tree) }));
    if (state.tree !== tree) {
        setState({ tree, expanded: startExpanded(tree) });
    }
    const { expanded } = state;

    const rows = useMemo(() => {
        const visible: TreeRow[] = [];
        const visit = (nodes: readonly FileTree[], parent: string, level: number) => {
            for (const node of nodes) {
                const path = pathOf(parent, node);
                const expandable = !!node.children && node.children.length > 0;
                const isExpanded = expandable && expanded.has(path);
                visible.push({ node, path, level, expandable, expanded: isExpanded });
                if (isExpanded && node.children) {
                    visit(node.children, path, level + 1);
                }
            }
        };
        visit(tree, '', 0);
        return visible;
    }, [tree, expanded]);

    const change = useCallback((update: (paths: Set<string>) => void) => {
        setState(current => {
            const paths = new Set(current.expanded);
            update(paths);
            return paths.size === current.expanded.size &&
                [...paths].every(path => current.expanded.has(path))
                ? current
                : { ...current, expanded: paths };
        });
    }, []);

    const toggle = useCallback(
        (path: string) =>
            change(paths => {
                if (!paths.delete(path)) {
                    paths.add(path);
                }
            }),
        [change]
    );
    const expand = useCallback((path: string) => change(paths => paths.add(path)), [change]);
    const collapse = useCallback(
        (path: string) =>
            change(paths => {
                paths.delete(path);
            }),
        [change]
    );

    // Legacy expandTreeByFileName (file-tree.component.ts:63-78) looked the folders up by name and
    // level only, so with two folders of the same name on one level (packages/a/src and
    // packages/b/src) it could expand the wrong one; here the folders on the path of the file
    // (ADR-011 A21).
    const expandToFile = useCallback(
        (fileName: string) =>
            change(paths => {
                const parts = fileName.split('/');
                parts.shift(); // remove first empty string element (fileName always starts with '/')
                parts.pop(); // the file itself
                let path = '';
                for (const part of parts) {
                    path = `${path}/${part}`;
                    paths.add(path);
                }
            }),
        [change]
    );

    return { rows, toggle, expand, collapse, expandToFile };
};
