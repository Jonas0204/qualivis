import type { View, VisualLink, VisualNode } from '@qualivis/core';
import { linkCoordinates } from './GraphLink';
import { nodeTransform } from './GraphNode';

const layer = (zoomGroup: SVGGElement, className: string): Element | undefined =>
    Array.from(zoomGroup.children).find(child => child.classList.contains(className));

/**
 * Moves the drawn nodes and links of the zoom group (GraphCanvas) to the current positions without
 * React, so that a layout frame does not render the whole graph again (P08-S09; the legacy app
 * also set the attributes in its tick handler, graph.component.ts:657-671). It writes what
 * GraphNode and GraphLink would render. False, without writing anything, when the drawn graph does
 * not match `nodes` and `links` (e.g. not drawn yet): then React has to render.
 */
export const writePositions = (
    zoomGroup: SVGGElement | null,
    nodes: readonly VisualNode[],
    links: readonly VisualLink[],
    view: View
): boolean => {
    const nodeLayer = zoomGroup && layer(zoomGroup, 'nodes');
    const linkLayer = zoomGroup && layer(zoomGroup, 'links');
    if (
        !nodeLayer ||
        !linkLayer ||
        nodeLayer.children.length !== nodes.length ||
        linkLayer.children.length !== links.length
    ) {
        return false;
    }

    nodes.forEach((node, index) => {
        nodeLayer.children[index]?.setAttribute('transform', nodeTransform(node));
    });
    links.forEach((link, index) => {
        const line = linkLayer.children[index];
        if (!(line instanceof SVGElement)) {
            return;
        }
        const coordinates = linkCoordinates(link, view);
        if (coordinates) {
            line.setAttribute('x1', String(coordinates.x1));
            line.setAttribute('y1', String(coordinates.y1));
            line.setAttribute('x2', String(coordinates.x2));
            line.setAttribute('y2', String(coordinates.y2));
        }
        line.style.display = coordinates ? '' : 'none';
    });
    return true;
};
