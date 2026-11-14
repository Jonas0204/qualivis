import type { VisualLink, VisualNode } from '@qualivis/core';
import { describe, expect, it } from 'vitest';
import { renderWithState } from '../../test/renderWithState';
import { GraphCanvas } from './GraphCanvas';
import type { GraphNodeSettings } from './GraphNode';
import { largeGraph } from './layout/largeGraph';
import { writePositions } from './writePositions';

const settings: GraphNodeSettings = { text: true, currentSizeMetricErrorHighlighting: false };

const node = (id: string, x: number, y: number): VisualNode => ({
    id,
    x,
    y,
    width: 48,
    height: 48,
    warn: false,
    error: false,
    type: 'component',
});

const draw = (nodes: VisualNode[], links: VisualLink[], drawn = { nodes, links }) => {
    const { container } = renderWithState(
        <GraphCanvas nodes={drawn.nodes} links={drawn.links} view="component" settings={settings} />
    );
    const zoomGroup = container.querySelector<SVGGElement>('g.zoom-group');
    const transforms = () =>
        Array.from(container.querySelectorAll('g.node'), group => group.getAttribute('transform'));
    const lines = () =>
        Array.from(container.querySelectorAll('g.links line'), line => ({
            x1: line.getAttribute('x1'),
            y1: line.getAttribute('y1'),
            x2: line.getAttribute('x2'),
            y2: line.getAttribute('y2'),
            style: line.getAttribute('style'),
        }));
    const displays = () =>
        Array.from(container.querySelectorAll<SVGGElement>('g.node'), group => group.style.display);
    const paths = () =>
        Array.from(container.querySelectorAll('g.links path'), path => path.getAttribute('d'));
    return { zoomGroup, transforms, lines, displays, paths };
};

/** As many links from a to b as it takes for the links to be drawn as paths. */
const manyLinks = (a: VisualNode, b: VisualNode): VisualLink[] =>
    Array.from({ length: largeGraph.bundledLinks }, () => ({ source: a, target: b }));

describe('writePositions', () => {
    it('moves the drawn nodes and links like GraphNode and GraphLink would draw them', () => {
        const a = node('a', 0, 0);
        const b = node('b', 100, 0);
        const links = [{ source: a, target: b }];
        const { zoomGroup, transforms, lines } = draw([a, b], links);

        a.x = 0;
        a.y = 50;
        b.x = 0;
        b.y = 150;
        expect(writePositions(zoomGroup, { nodes: [a, b], links, view: 'component' })).toBe(true);

        expect(transforms()).toEqual(['translate(0, 50)', 'translate(0, 150)']);
        // Radius 24 plus half the stroke: the arrow ends 24.5 before the target centre.
        expect(lines()).toEqual([{ x1: '0', y1: '50', x2: '0', y2: '125.5', style: null }]);
        const redrawn = draw([a, b], links);
        expect(redrawn.transforms()).toEqual(transforms());
        expect(redrawn.lines()).toEqual(lines());
    });

    it('hides a link while source and target are on the same spot and shows it again', () => {
        const a = node('a', 0, 0);
        const b = node('b', 100, 0);
        const links = [{ source: a, target: b }];
        const { zoomGroup, lines } = draw([a, b], links);

        b.x = 0;
        writePositions(zoomGroup, { nodes: [a, b], links, view: 'component' });
        expect(lines()[0]?.style).toBe('display: none;');

        b.x = 100;
        writePositions(zoomGroup, { nodes: [a, b], links, view: 'component' });
        expect(lines()[0]).toEqual({ x1: '0', y1: '0', x2: '75.5', y2: '0', style: '' });
    });

    it('writes nothing and returns false when the drawn graph does not match', () => {
        const a = node('a', 0, 0);
        const b = node('b', 100, 0);
        const links = [{ source: a, target: b }];
        const { zoomGroup, transforms } = draw([a, b], links, { nodes: [], links: [] });

        expect(writePositions(zoomGroup, { nodes: [a, b], links, view: 'component' })).toBe(false);
        expect(writePositions(null, { nodes: [a, b], links, view: 'component' })).toBe(false);
        expect(transforms()).toEqual([]);
    });

    it('moves the links of a large graph, which are drawn as paths', () => {
        const a = node('a', 0, 0);
        const b = node('b', 100, 0);
        const links = manyLinks(a, b);
        const { zoomGroup, paths } = draw([a, b], links);
        const before = paths();

        b.y = 100;
        expect(writePositions(zoomGroup, { nodes: [a, b], links, view: 'component' })).toBe(true);

        expect(paths()[0]).not.toBe(before[0]);
        expect(paths()).toEqual(draw([a, b], links).paths());
        // Other links than the drawn ones, though as many: React has to render.
        expect(
            writePositions(zoomGroup, { nodes: [a, b], links: manyLinks(a, b), view: 'component' })
        ).toBe(false);
    });

    it('hides the nodes and leaves out the bundled links outside of the area', () => {
        const a = node('a', 0, 0);
        const b = node('b', 100, 0);
        const far = node('far', 5000, 5000);
        const links = [...manyLinks(a, b).slice(1), { source: far, target: far }];
        const nodes = [a, b, far];
        const { zoomGroup, transforms, displays, paths } = draw(nodes, links);
        const all = paths();
        const area = { x: -50, y: -50, width: 200, height: 100 };

        far.x = 6000;
        writePositions(zoomGroup, { nodes, links, view: 'component', area });

        expect(displays()).toEqual(['', '', 'none']);
        // A hidden node is not moved.
        expect(transforms()[2]).toBe('translate(5000, 5000)');
        expect(paths()).toEqual(all);

        b.x = 1000;
        b.y = 1000;
        writePositions(zoomGroup, { nodes, links, view: 'component', area });
        expect(displays()).toEqual(['', 'none', 'none']);
        // Both ends count for a link: it still starts inside the area.
        expect(paths()[0]).not.toBe('');

        a.x = 900;
        a.y = 900;
        writePositions(zoomGroup, { nodes, links, view: 'component', area });
        expect(paths().every(d => d === '')).toBe(true);

        // Without an area, as at the end of the layout, everything shows where it is.
        writePositions(zoomGroup, { nodes, links, view: 'component' });
        expect(displays()).toEqual(['', '', '']);
        expect(transforms()).toEqual([
            'translate(900, 900)',
            'translate(1000, 1000)',
            'translate(6000, 5000)',
        ]);
        expect(paths()[0]).not.toBe('');
    });
});
