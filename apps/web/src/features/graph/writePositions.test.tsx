import type { VisualLink, VisualNode } from '@qualivis/core';
import { describe, expect, it } from 'vitest';
import { renderWithState } from '../../test/renderWithState';
import { GraphCanvas } from './GraphCanvas';
import type { GraphNodeSettings } from './GraphNode';
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
    return { zoomGroup, transforms, lines };
};

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
        expect(writePositions(zoomGroup, [a, b], links, 'component')).toBe(true);

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
        writePositions(zoomGroup, [a, b], links, 'component');
        expect(lines()[0]?.style).toBe('display: none;');

        b.x = 100;
        writePositions(zoomGroup, [a, b], links, 'component');
        expect(lines()[0]).toEqual({ x1: '0', y1: '0', x2: '75.5', y2: '0', style: '' });
    });

    it('writes nothing and returns false when the drawn graph does not match', () => {
        const a = node('a', 0, 0);
        const b = node('b', 100, 0);
        const links = [{ source: a, target: b }];
        const { zoomGroup, transforms } = draw([a, b], links, { nodes: [], links: [] });

        expect(writePositions(zoomGroup, [a, b], links, 'component')).toBe(false);
        expect(writePositions(null, [a, b], links, 'component')).toBe(false);
        expect(transforms()).toEqual([]);
    });
});
