import type { VisualLink, VisualNode } from '@qualivis/core';
import { act } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { renderWithState } from '../../test/renderWithState';
import { GraphCanvas, type GraphZoom } from './GraphCanvas';
import type { GraphNodeSettings } from './GraphNode';

const settings: GraphNodeSettings = { text: true, currentSizeMetricErrorHighlighting: false };

const placed = (id: string, x: number, y: number, extra: Partial<VisualNode> = {}): VisualNode => ({
    id,
    x,
    y,
    width: 48,
    height: 48,
    warn: false,
    error: false,
    type: 'component',
    ...extra,
});

const app = placed('/app/src/App.js#App', 0, 0, { label: 'App', kind: 'ClassComponent' });
const header = placed('/app/src/Header.js#Header', 100, 0, { label: 'Header' });
const footer = placed('/app/src/Footer.js#Footer', 0, 100);
const nodes = [app, header, footer];
const links: VisualLink[] = [
    { source: app, target: header },
    { source: app, target: footer, inherits: true },
];

const drawCanvas = (
    props: { showCluster?: boolean; nodes?: VisualNode[]; zoom?: GraphZoom } = {}
) =>
    renderWithState(
        <GraphCanvas
            nodes={props.nodes ?? nodes}
            links={links}
            view="component"
            settings={settings}
            showCluster={props.showCluster}
            zoom={props.zoom}
        />
    );

/** Label size and link width that the zoom group passes on as CSS variables. */
const zoomStyle = (container: HTMLElement) => {
    const style = container.querySelector<SVGGElement>('g.zoom-group')?.style;
    return {
        labelFontSize: style?.getPropertyValue('--qv-label-font-size'),
        linkStrokeWidth: style?.getPropertyValue('--qv-link-stroke-width'),
    };
};

describe('GraphCanvas', () => {
    it('draws one group per node with its label, or its id without a label', () => {
        const { container } = drawCanvas();

        const groups = container.querySelectorAll('g.node');
        expect(groups).toHaveLength(3);
        expect(Array.from(groups, group => group.getAttribute('transform'))).toEqual([
            'translate(0, 0)',
            'translate(100, 0)',
            'translate(0, 100)',
        ]);
        expect(
            Array.from(container.querySelectorAll('.label-text'), label => label.textContent)
        ).toEqual(['App', 'Header', '/app/src/Footer.js#Footer']);
    });

    it('draws one arrow per link, all with the marker of this graph', () => {
        const { container } = drawCanvas();

        const marker = container.querySelector('marker');
        const lines = Array.from(container.querySelectorAll('g.links line'));
        expect(lines).toHaveLength(2);
        expect(marker?.id).toMatch(/^qv-arrowhead-[\w-]+$/);
        for (const line of lines) {
            expect(line.getAttribute('marker-end')).toBe(`url(#${marker?.id})`);
        }
        expect(lines[1]?.getAttribute('stroke-dasharray')).toBe('4 2');
    });

    it('hatches class components with the pattern of this graph', () => {
        const { container } = drawCanvas();

        const pattern = container.querySelector('pattern.diagonal-hatch');
        expect(pattern?.id).toMatch(/^qv-hatch-[\w-]+$/);
        expect(container.querySelector('.circle-overlay')?.getAttribute('fill')).toBe(
            `url(#${pattern?.id})`
        );
    });

    it('draws nodes and links in the zoom group, unscaled without zoom', () => {
        const { container } = drawCanvas();

        const zoomGroup = container.querySelector('svg > g.zoom-group');
        expect(zoomGroup?.getAttribute('transform')).toBe('translate(0,0) scale(1)');
        expect(zoomGroup?.getAttribute('class')).toBe('zoom-group');
        expect(zoomGroup?.querySelectorAll('g.node')).toHaveLength(3);
        expect(zoomGroup?.querySelectorAll('g.links line')).toHaveLength(2);
        expect(container.querySelector('.node-label')?.getAttribute('style')).toBeNull();
        expect(container.querySelector('g.links line')?.getAttribute('style')).toBeNull();
    });

    it('applies the zoom transform and the sizes set by zooming', () => {
        const { container } = drawCanvas({
            zoom: {
                transform: { k: 2.5, x: 10, y: -20 },
                transition: true,
                labelFontSize: 8,
                linkStrokeWidth: 0.64,
            },
        });

        const zoomGroup = container.querySelector('g.zoom-group');
        // The first frame shows at once, also with the wheel transition.
        expect(zoomGroup?.getAttribute('transform')).toBe('translate(10,-20) scale(2.5)');
        expect(zoomGroup?.getAttribute('class')).toBe('zoom-group');
        // One style on the zoom group instead of one per label and link (graph.css uses them).
        expect(zoomStyle(container)).toEqual({ labelFontSize: '8px', linkStrokeWidth: '0.64' });
        for (const label of container.querySelectorAll('.node-label')) {
            expect(label.getAttribute('style')).toBeNull();
        }
        for (const line of container.querySelectorAll('g.links line')) {
            expect(line.getAttribute('style')).toBeNull();
        }
    });

    it('eases transform and sizes for 100 ms with the wheel transition, from where they are', () => {
        vi.useFakeTimers({ toFake: ['requestAnimationFrame', 'cancelAnimationFrame'] });
        try {
            const canvas = (zoom: GraphZoom) => (
                <GraphCanvas
                    nodes={nodes}
                    links={links}
                    view="component"
                    settings={settings}
                    zoom={zoom}
                />
            );
            const { container, rerender } = renderWithState(
                canvas({ transform: { k: 1, x: 0, y: 0 } })
            );
            const transform = () =>
                container.querySelector('g.zoom-group')?.getAttribute('transform');
            const frames = (count: number) => {
                act(() => {
                    for (let i = 0; i < count; i++) {
                        vi.advanceTimersToNextFrame();
                    }
                });
            };
            const zoomed = { k: 3, x: -100, y: -50 };

            rerender(
                canvas({
                    transform: zoomed,
                    transition: true,
                    labelFontSize: 8,
                    linkStrokeWidth: 0.4,
                })
            );
            // Before the first frame the old values are still on screen.
            expect(transform()).toBe('translate(0,0) scale(1)');
            expect(zoomStyle(container)).toEqual({ labelFontSize: '14px', linkStrokeWidth: '0.8' });

            frames(4);
            const k = Number(/scale\((.*)\)/.exec(transform() ?? '')?.[1]);
            expect(k).toBeGreaterThan(1);
            expect(k).toBeLessThan(3);
            const size = Number.parseFloat(zoomStyle(container).labelFontSize ?? '');
            expect(size).toBeGreaterThan(8);
            expect(size).toBeLessThan(14);

            frames(10);
            expect(transform()).toBe('translate(-100,-50) scale(3)');
            expect(zoomStyle(container)).toEqual({ labelFontSize: '8px', linkStrokeWidth: '0.4' });

            // Without the transition (pan, zoom to fit) the next transform shows at once.
            rerender(
                canvas({ transform: { k: 3, x: 0, y: 0 }, labelFontSize: 8, linkStrokeWidth: 0.4 })
            );
            expect(transform()).toBe('translate(0,0) scale(3)');
        } finally {
            vi.useRealTimers();
        }
    });

    it('gives the zoom group the default label size and link width without zooming', () => {
        const { container } = drawCanvas();

        expect(zoomStyle(container)).toEqual({ labelFontSize: '14px', linkStrokeWidth: '0.8' });
    });

    it('gives two graphs in one document their own defs', () => {
        const first = drawCanvas().container.querySelector('marker')?.id;
        const second = drawCanvas().container.querySelector('marker')?.id;

        expect(first).toBeDefined();
        expect(second).not.toBe(first);
    });

    it('paints the clusters of the component view only with cluster colours on', () => {
        const clustered = [placed('a', 0, 0, { type: 'innerFunction', cluster: 0 }), header];

        const on = drawCanvas({ nodes: clustered, showCluster: true }).container;
        const off = drawCanvas({ nodes: clustered }).container;

        const fills = (container: HTMLElement) =>
            Array.from(container.querySelectorAll('.circle-node'), circle =>
                circle.getAttribute('style')
            );
        // Cluster 0 as captured from the legacy app (testdata/golden/mini/legacy-cluster-colors.json).
        expect(fills(on)).toEqual(['fill: rgb(224, 199, 246);', null]);
        expect(fills(off)).toEqual([null, null]);
    });
});
