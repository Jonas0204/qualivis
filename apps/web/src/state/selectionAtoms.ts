import { buildViewModel, graphSettings, type VisualIcon } from '@qualivis/core';
import { atom } from 'jotai';
import { analysisAtom } from './analysisAtoms';
import {
    createFileSelection,
    createNodeSelection,
    type NodeSelection,
    type SelectableNode,
} from './selection';

export type { NodeSelection, SelectedNode } from './selection';

/** The selected nodes; null when nothing is selected, as in the legacy app. */
export const selectionAtom = atom<NodeSelection[] | null>(null);

/**
 * Icons of the nodes of the app graph by id, for a file selected in the file tree (ADR-011 A9).
 * The icons do not depend on the size metric, so the default one is enough.
 */
const appIconsAtom = atom(get => {
    const result = get(analysisAtom).result;
    const icons = new Map<string, VisualIcon[]>();
    if (!result) {
        return icons;
    }
    const { nodes } = buildViewModel(result.appGraph, {
        view: 'app',
        sizeMetric: graphSettings.defaultSizeMetric,
        nodeSizesBasedOnMetrics: true,
    });
    for (const node of nodes) {
        icons.set(node.id, node.icons ?? []);
    }
    return icons;
});

/**
 * Selects one node (legacy DataService.selectNode): a node of the graph, or the function of a
 * preview circle with its component as `componentId`.
 */
export const selectNodeAtom = atom(
    null,
    (get, set, node: SelectableNode, componentId: string | undefined) => {
        const fileMap = get(analysisAtom).result?.fileMap ?? {};
        const selectedNode = createNodeSelection(fileMap, node, componentId);
        // biome-ignore lint/suspicious/noConsole: legacy log, kept for debugging (user, 09.11.2026)
        console.log('Select node: ', selectedNode);
        set(selectionAtom, [selectedNode]);
    }
);

/** Selects all components of a file (legacy DataService.selectFile). */
export const selectFileAtom = atom(null, (get, set, fileName: string) => {
    const result = get(analysisAtom).result;
    const selectedNodes = result
        ? createFileSelection(result.fileMap, result.report, fileName, get(appIconsAtom))
        : [];
    // biome-ignore lint/suspicious/noConsole: legacy log, kept for debugging (user, 09.11.2026)
    console.log('Select file -> nodes: ', selectedNodes);
    set(selectionAtom, selectedNodes);
});

/** Clears the selection (legacy DataService.deselectNodes sets null). */
export const deselectAtom = atom(null, (_get, set) => {
    set(selectionAtom, null);
});
