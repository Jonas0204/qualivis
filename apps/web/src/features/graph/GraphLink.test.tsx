import type { VisualLink, VisualNode } from '@qualivis/core';
import { describe, expect, it } from 'vitest';
import { renderWithState } from '../../test/renderWithState';
import { GraphLink } from './GraphLink';

const node = (id: string, x: number, y: number, width: number): VisualNode => ({
    id,
    width,
    height: width,
    warn: false,
    error: false,
    x,
    y,
});

const drawLine = (link: VisualLink, view: 'app' | 'component' = 'component') =>
    renderWithState(
        <svg role="img" aria-label="Test graph">
            <GraphLink link={link} view={view} />
        </svg>
    ).container.querySelector('line');

const coordinates = (line: Element | null) =>
    ['x1', 'y1', 'x2', 'y2'].map(name => Number(line?.getAttribute(name)));

describe('GraphLink', () => {
    it('ends at the edge of the target circle plus half its stroke', () => {
        const line = drawLine({ source: node('a', 0, 0, 48), target: node('b', 100, 0, 48) });

        expect(coordinates(line)).toEqual([0, 0, 75.5, 0]);
        expect(line?.getAttribute('stroke-width')).toBe('0.8');
        expect(line?.getAttribute('marker-end')).toBe('url(#arrowhead)');
        expect(line?.getAttribute('stroke-dasharray')).toBeNull();
    });

    it('leaves the preview ring out of the target radius in the app view', () => {
        // Width 62 in the app view: main radius 24, the same end as above.
        const line = drawLine(
            { source: node('a', 0, 0, 62), target: node('b', 100, 0, 62) },
            'app'
        );

        expect(coordinates(line)).toEqual([0, 0, 75.5, 0]);
    });

    it('dashes the link to an inherited component', () => {
        const line = drawLine({
            source: node('a', 0, 0, 48),
            target: node('b', 0, 100, 48),
            inherits: true,
        });

        expect(line?.getAttribute('stroke-dasharray')).toBe('4 2');
    });

    it('draws nothing when source and target are on the same spot', () => {
        expect(drawLine({ source: node('a', 5, 5, 48), target: node('b', 5, 5, 48) })).toBeNull();
    });
});
