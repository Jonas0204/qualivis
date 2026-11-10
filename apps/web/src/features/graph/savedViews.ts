import type { Graph } from '@qualivis/core';
import { useLayoutEffect, useRef } from 'react';
import type { LayoutNode, LayoutRestore } from './layout/types';
import type { ZoomStyle, ZoomTransform } from './zoomMath';

/**
 * How a view looked when it was left (ADR-011 A22): node positions, whether the layout was still
 * running, zoom, and what the node sizes depend on.
 */
export type SavedView = {
    positions: ReadonlyMap<string, LayoutNode>;
    running: boolean;
    transform: ZoomTransform;
    zoomStyle: ZoomStyle;
    sizeMetric: string;
    nodeSizesBasedOnMetrics: boolean;
};

/** The saved views by graph; a new analysis starts without any. */
export type SavedViews = WeakMap<Graph, SavedView>;

/** What the node sizes depend on. */
export type NodeSizing = { sizeMetric: string; nodeSizesBasedOnMetrics: boolean };

/** Gives the nodes the position (and pin) of the node with the same id. */
export const placeLike = (
    nodes: readonly LayoutNode[],
    before: ReadonlyMap<string, LayoutNode>
) => {
    for (const node of nodes) {
        const old = before.get(node.id);
        if (old) {
            node.x = old.x;
            node.y = old.y;
            node.fx = old.fx;
            node.fy = old.fy;
        }
    }
};

const isPlaced = (node: LayoutNode) => node.x !== undefined && node.y !== undefined;

/**
 * The saved view if it has the same nodes with the same sizes; then the nodes get its positions.
 * Otherwise undefined, and the view is laid out from scratch.
 */
export const restoreView = (
    saved: SavedView | undefined,
    nodes: readonly LayoutNode[],
    { sizeMetric, nodeSizesBasedOnMetrics }: NodeSizing
): SavedView | undefined => {
    const fits =
        saved !== undefined &&
        saved.sizeMetric === sizeMetric &&
        saved.nodeSizesBasedOnMetrics === nodeSizesBasedOnMetrics &&
        saved.positions.size === nodes.length &&
        nodes.every(node => saved.positions.has(node.id));
    if (!fits) {
        return undefined;
    }
    placeLike(nodes, saved.positions);
    return saved;
};

/** How the engine starts for a restored view; undefined lays it out from scratch. */
export const layoutRestore = (restored: SavedView | undefined): LayoutRestore | undefined =>
    restored && { running: restored.running };

/** A view restored at rest keeps its zoom; the others fit in after their first layout end. */
export const isRestoredAtRest = (restored: SavedView | undefined): boolean =>
    restored !== undefined && !restored.running;

/** Label size and link width of a restored view; the defaults for a new layout. */
export const restoredZoomStyle = (restored: SavedView | undefined): ZoomStyle =>
    restored?.zoomStyle ?? {};

/**
 * Shows the zoom of a restored view before the paint, so that it never shows with the zoom of the
 * view before.
 */
export const useRestoreZoom = (
    restored: SavedView | undefined,
    restore: (transform: ZoomTransform) => void
): void => {
    useLayoutEffect(() => {
        if (restored) {
            restore(restored.transform);
        }
    }, [restored, restore]);
};

/** The saved views of the current analysis. */
export const useSavedViews = (analysis: unknown): SavedViews => {
    const ref = useRef({ analysis, views: new WeakMap() as SavedViews });
    if (ref.current.analysis !== analysis) {
        ref.current = { analysis, views: new WeakMap() };
    }
    return ref.current.views;
};

type SaveViewOptions = NodeSizing & {
    views: SavedViews;
    graph: Graph | undefined;
    /** The nodes of the shown view model; a new array means another view or a restart. */
    nodes: readonly LayoutNode[] | undefined;
    /** True once the layout has come to rest (useLayout). */
    ended: boolean;
    zoomStyle: ZoomStyle;
    getTransform: () => ZoomTransform;
};

/**
 * Saves the view when it is left or restarts, with the layout state and zoom of that moment.
 * A layout effect, so that it saves before the next view restores its zoom.
 */
export const useSaveView = ({
    views,
    graph,
    nodes,
    ended,
    zoomStyle,
    getTransform,
    sizeMetric,
    nodeSizesBasedOnMetrics,
}: SaveViewOptions): void => {
    const latestRef = useRef({ ended, zoomStyle });
    latestRef.current = { ended, zoomStyle };

    useLayoutEffect(() => {
        if (!graph || !nodes) {
            return;
        }
        return () => {
            if (!nodes.every(isPlaced)) {
                return;
            }
            views.set(graph, {
                positions: new Map(nodes.map(node => [node.id, node])),
                running: !latestRef.current.ended,
                transform: getTransform(),
                zoomStyle: latestRef.current.zoomStyle,
                sizeMetric,
                nodeSizesBasedOnMetrics,
            });
        };
    }, [views, graph, nodes, getTransform, sizeMetric, nodeSizesBasedOnMetrics]);
};
