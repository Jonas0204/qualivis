import { describe, expect, it } from 'vitest';
import { renderWithState } from '../../test/renderWithState';
import type { ViewLink, ViewNode } from './buildViewGraph';
import { GraphCanvas } from './GraphCanvas';

const placed = (id: string, x: number, y: number, label?: string): ViewNode => ({
    id,
    label,
    x,
    y,
    width: 48,
    height: 48,
});

const app = placed('/app/src/App.js#App', 0, 0, 'App');
const header = placed('/app/src/Header.js#Header', 100, 0, 'Header');
const footer = placed('/app/src/Footer.js#Footer', 0, 100);
const nodes = [app, header, footer];
const links: ViewLink[] = [
    { source: app, target: header },
    { source: app, target: footer, inherits: true },
];

describe('GraphCanvas', () => {
    it('draws one group per node with its label, or its id without a label', () => {
        const { container, getByRole } = renderWithState(
            <GraphCanvas nodes={nodes} links={links} viewBox="0 0 10 10" />
        );

        expect(getByRole('img', { name: 'Component graph' }).getAttribute('viewBox')).toBe(
            '0 0 10 10'
        );
        const groups = container.querySelectorAll('g.node');
        expect(groups).toHaveLength(3);
        expect(Array.from(groups, group => group.getAttribute('transform'))).toEqual([
            'translate(0, 0)',
            'translate(100, 0)',
            'translate(0, 100)',
        ]);
        expect(
            Array.from(container.querySelectorAll('.node-label'), label => label.textContent)
        ).toEqual(['App', 'Header', '/app/src/Footer.js#Footer']);
        expect(container.querySelectorAll('circle.circle-node.component[r="24"]')).toHaveLength(3);
        expect(container.querySelectorAll('circle.circle-overlay.component[r="24"]')).toHaveLength(
            3
        );
    });

    it('draws one arrow per link that ends at the edge of the target circle', () => {
        const { container } = renderWithState(
            <GraphCanvas nodes={nodes} links={links} viewBox="0 0 10 10" />
        );

        const lines = Array.from(container.querySelectorAll('line'));
        expect(lines).toHaveLength(2);
        for (const line of lines) {
            expect(line.getAttribute('marker-end')).toBe('url(#arrowhead)');
        }
        expect(['x1', 'y1', 'x2', 'y2'].map(name => lines[0]?.getAttribute(name))).toEqual([
            '0',
            '0',
            '75.5',
            '0',
        ]);
        expect(lines[0]?.getAttribute('stroke-dasharray')).toBeNull();
        expect(lines[1]?.getAttribute('stroke-dasharray')).toBe('4 2');
        expect(container.querySelector('marker#arrowhead')).not.toBeNull();
    });
});
