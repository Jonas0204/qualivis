import type { View, VisualLink, VisualNode } from '@qualivis/core';
import { linkCoordinates } from './GraphLink';
import { nodeTransform } from './GraphNode';
import { linkWriters } from './linkPaths';
import type { Bounds } from './zoomMath';

const layer = (zoomGroup: SVGGElement, className: string): Element | undefined =>
    Array.from(zoomGroup.children).find(child => child.classList.contains(className));

const isStyled = (element: Element | undefined): element is SVGElement =>
    element instanceof SVGElement;

/** The node groups this module has hidden, so that it need not read their style in every frame. */
const hidden = new WeakSet<Element>();

const inside = (node: VisualNode, area: Bounds): boolean => {
    const x = node.x ?? 0;
    const y = node.y ?? 0;
    return x >= area.x && x <= area.x + area.width && y >= area.y && y <= area.y + area.height;
};

const writeLines = (lines: HTMLCollection, links: readonly VisualLink[], view: View) => {
    links.forEach((link, index) => {
        const line = lines[index];
        if (!isStyled(line)) {
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
};

export type DrawnGraph = {
    nodes: readonly VisualNode[];
    links: readonly VisualLink[];
    view: View;
    /**
     * While the layout runs: the part of the graph to draw, the visible part with some room for
     * the size of the nodes and their labels. Nodes outside of it are hidden instead of moved and
     * bundled links outside of it are left out, since most of a large graph is out of sight while
     * it is laid out (P08-S09). Without it everything is drawn, as it has to be at rest, where
     * panning and zooming move the drawn graph as a whole.
     */
    area?: Bounds;
};

/**
 * Moves the drawn nodes and links of the zoom group (GraphCanvas) to the current positions without
 * React, so that a layout frame does not render the whole graph again (P08-S09; the legacy app
 * also set the attributes in its tick handler, graph.component.ts:657-671). It writes what
 * GraphNode and GraphLink or GraphLinkBundles would render. False, without writing anything, when
 * the drawn graph does not match `nodes` and `links` (e.g. not drawn yet): then React has to render.
 */
export const writePositions = (
    zoomGroup: SVGGElement | null,
    { nodes, links, view, area }: DrawnGraph
): boolean => {
    const nodeLayer = zoomGroup && layer(zoomGroup, 'nodes');
    const linkLayer = zoomGroup && layer(zoomGroup, 'links');
    const linkWriter = linkLayer && linkWriters.get(linkLayer);
    if (
        !nodeLayer ||
        !linkLayer ||
        nodeLayer.children.length !== nodes.length ||
        (linkWriter ? linkWriter.links !== links : linkLayer.children.length !== links.length)
    ) {
        return false;
    }

    nodes.forEach((node, index) => {
        const group = nodeLayer.children[index];
        if (!isStyled(group)) {
            return;
        }
        const shown = !area || inside(node, area);
        if (shown) {
            group.setAttribute('transform', nodeTransform(node));
        }
        // Only on a change: the style of a node is not touched in most frames.
        if (hidden.has(group) === shown) {
            group.style.display = shown ? '' : 'none';
            if (shown) {
                hidden.delete(group);
            } else {
                hidden.add(group);
            }
        }
    });
    if (linkWriter) {
        linkWriter.write(area);
    } else {
        writeLines(linkLayer.children, links, view);
    }
    return true;
};
