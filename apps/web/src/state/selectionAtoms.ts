import type { VisualNode } from '@qualivis/core';
import { atom } from 'jotai';

/**
 * A selected node: the fields the legacy NodeSelection took from the node (data.service.ts:117-131).
 * Code and lines of the component or function follow with the panels in P06-S02.
 */
export type SelectedNode = Pick<VisualNode, 'id' | 'label' | 'type' | 'report' | 'icons'>;

/** The selected nodes; null when nothing is selected, as in the legacy app. */
export const selectionAtom = atom<SelectedNode[] | null>(null);

/** Selects one node of the graph (legacy DataService.selectNode). */
export const selectGraphNodeAtom = atom(
    null,
    (_get, set, { id, label, type, report, icons }: VisualNode) => {
        const selectedNode: SelectedNode = { id, label, type, report, icons };
        // biome-ignore lint/suspicious/noConsole: legacy log, kept for debugging (user, 09.11.2026)
        console.log('Select node: ', selectedNode);
        set(selectionAtom, [selectedNode]);
    }
);
