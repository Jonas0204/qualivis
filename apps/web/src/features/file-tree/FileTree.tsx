import { extractFileTree } from '@qualivis/core';
import { useAtomValue, useSetAtom } from 'jotai';
import { type KeyboardEvent, useEffect, useMemo, useRef, useState } from 'react';
import { analysisAtom } from '../../state/analysisAtoms';
import { getComponentName } from '../../state/selection';
import { selectFileAtom, selectionAtom } from '../../state/selectionAtoms';
import { componentIdAtom } from '../../state/viewAtoms';
import { Icon } from '../../ui/Icon';
import styles from './FileTree.module.css';
import { type TreeRow, useTreeState } from './useTreeState';

/** Time a click on a file waits for a double click before going to the app view (F5). */
export const fileClickDelay = 500;

/**
 * The file tree of the left column (legacy file-tree.component): folders first, levels 0 and 1
 * expanded, a click on a file selects it and goes back to the app view after 500 ms, a double click
 * opens the component view of a file with one component (F1-F7).
 */
export const FileTree = () => {
    const fileMap = useAtomValue(analysisAtom).result?.fileMap;
    const selection = useAtomValue(selectionAtom);
    const selectFile = useSetAtom(selectFileAtom);
    const setComponentId = useSetAtom(componentIdAtom);
    const tree = useMemo(() => (fileMap ? extractFileTree(fileMap) : []), [fileMap]);
    const { rows, toggle, expand, collapse, expandToFile } = useTreeState(tree);
    const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined);
    const rowRefs = useRef(new Map<string, HTMLDivElement>());
    const [focusedPath, setFocusedPath] = useState<string>();

    useEffect(() => {
        if (fileMap) {
            // biome-ignore lint/suspicious/noConsole: legacy log, kept for debugging (user, 09.11.2026)
            console.log('FileTree:', tree);
        }
    }, [fileMap, tree]);

    // F7: expand the folders of every selected file, also for a selection in the graph.
    useEffect(() => {
        for (const selectedNode of selection ?? []) {
            expandToFile(selectedNode.id.split('#')[0] ?? '');
        }
    }, [selection, expandToFile]);

    useEffect(() => () => clearTimeout(timerRef.current), []);

    // The file of the first selected node (legacy isSelected); a file without components selects
    // nothing, where the legacy template threw.
    const selectedFile = selection?.[0]?.id.split('#')[0];

    const clickFile = (row: TreeRow) => {
        const fileName = row.node.id ?? row.path;
        if (selectedFile !== fileName) {
            selectFile(fileName);
        }
        clearTimeout(timerRef.current);
        timerRef.current = setTimeout(() => {
            timerRef.current = undefined;
            setComponentId(undefined);
        }, fileClickDelay);
    };

    const doubleClickFile = (row: TreeRow) => {
        clearTimeout(timerRef.current);
        timerRef.current = undefined;
        const fileName = row.node.id ?? row.path;
        const componentName = fileMap ? getComponentName(fileMap, fileName) : undefined;
        if (componentName) {
            setComponentId(`${fileName}#${componentName}`);
        }
    };

    const activate = (row: TreeRow) => {
        if (row.expandable) {
            toggle(row.path);
        } else {
            clickFile(row);
        }
    };

    const focusRow = (row: TreeRow | undefined) => {
        if (row) {
            setFocusedPath(row.path);
            rowRefs.current.get(row.path)?.focus();
        }
    };

    // Keyboard access, which the legacy tree did not have (A11y addition of the plan).
    const handleKeyDown = (event: KeyboardEvent, row: TreeRow, index: number) => {
        switch (event.key) {
            case 'ArrowDown':
                focusRow(rows[index + 1]);
                break;
            case 'ArrowUp':
                focusRow(rows[index - 1]);
                break;
            case 'ArrowRight':
                if (row.expandable && !row.expanded) {
                    expand(row.path);
                }
                break;
            case 'ArrowLeft':
                if (row.expandable && row.expanded) {
                    collapse(row.path);
                }
                break;
            case 'Enter':
                activate(row);
                break;
            default:
                return;
        }
        event.preventDefault();
    };

    const tabStop =
        rows.find(row => row.path === focusedPath)?.path ??
        rows.find(row => row.path === selectedFile)?.path ??
        rows[0]?.path;

    return (
        <div className={styles.tree} role="tree" aria-label="Files">
            {rows.map((row, index) => {
                const selected = !row.expandable && row.path === selectedFile;
                return (
                    <div
                        key={row.path}
                        ref={element => {
                            if (element) {
                                rowRefs.current.set(row.path, element);
                            } else {
                                rowRefs.current.delete(row.path);
                            }
                        }}
                        className={selected ? `${styles.row} ${styles.selected}` : styles.row}
                        style={{ paddingLeft: row.level * 28 }}
                        role="treeitem"
                        tabIndex={row.path === tabStop ? 0 : -1}
                        aria-level={row.level + 1}
                        aria-expanded={row.expandable ? row.expanded : undefined}
                        aria-selected={row.expandable ? undefined : selected}
                        aria-label={`toggle ${row.node.name}`}
                        onFocus={() => setFocusedPath(row.path)}
                        onClick={() => activate(row)}
                        onDoubleClick={() => {
                            if (!row.expandable) {
                                doubleClickFile(row);
                            }
                        }}
                        onKeyDown={event => handleKeyDown(event, row, index)}
                    >
                        <div className={styles.content}>
                            <Icon
                                name={row.node.type === 'folder' ? 'folder' : 'code'}
                                className={styles.icon}
                                size={20}
                            />
                            <span className={styles.name}>{row.node.name}</span>
                        </div>
                    </div>
                );
            })}
        </div>
    );
};
