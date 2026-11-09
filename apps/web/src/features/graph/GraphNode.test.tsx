import type { Node, View, VisualNode } from '@qualivis/core';
import type { ReactElement } from 'react';
import { describe, expect, it } from 'vitest';
import { renderWithState } from '../../test/renderWithState';
import { GraphNode, type GraphNodeSettings } from './GraphNode';

const settings: GraphNodeSettings = { text: true, currentSizeMetricErrorHighlighting: false };

/** Width 62 in the app view and 48 in the component view give a main radius of 24. */
const visual = (extra: Partial<VisualNode> = {}): VisualNode => ({
    id: '/app/src/App.js#App',
    label: 'App',
    type: 'component',
    kind: 'FunctionComponent',
    width: 62,
    height: 62,
    warn: false,
    error: false,
    x: 10,
    y: 20,
    ...extra,
});

const fn = (id: string, extra: Partial<Node> = {}): Node => ({
    id,
    type: 'innerFunction',
    ...extra,
});

const inSvg = (ui: ReactElement) =>
    renderWithState(
        <svg role="img" aria-label="Test graph">
            {ui}
        </svg>
    ).container;

const draw = (node: VisualNode, view: View = 'app', props: Partial<{ selected: boolean }> = {}) =>
    inSvg(<GraphNode node={node} view={view} settings={settings} {...props} />);

describe('GraphNode', () => {
    it('hatches class components and leaves function components transparent', () => {
        const classComponent = draw(visual({ kind: 'ClassComponent' }));
        const functionComponent = draw(visual());

        expect(classComponent.querySelector('.circle-overlay')?.getAttribute('fill')).toBe(
            'url(#diagonalHatch)'
        );
        expect(functionComponent.querySelector('.circle-overlay')?.getAttribute('fill')).toBe(
            'transparent'
        );
    });

    it('draws main circle and overlay with the main radius at the node position', () => {
        const container = draw(visual());

        expect(container.querySelector('g.node')?.getAttribute('transform')).toBe(
            'translate(10, 20)'
        );
        expect(container.querySelector('circle.circle-node.component')?.getAttribute('r')).toBe(
            '24'
        );
        expect(container.querySelector('circle.circle-overlay')?.getAttribute('r')).toBe('24');
        expect(container.querySelector('circle.circle-overlay')?.getAttribute('stroke-width')).toBe(
            '1'
        );
    });

    it('adds the inner circle 3 inside the main circle for a JSX function', () => {
        const container = draw(
            visual({ id: 'render', type: 'innerFunction', width: 48, returnsJSX: true }),
            'component'
        );

        const inner = container.querySelector('circle.inner-circle');
        expect(inner?.getAttribute('class')).toBe('inner-circle innerFunction');
        expect(inner?.getAttribute('r')).toBe('21');
        expect(inner?.getAttribute('fill')).toBe('none');
        expect(draw(visual()).querySelector('circle.inner-circle')).toBeNull();
    });

    it('marks a selected node', () => {
        const container = draw(visual({ special: true }), 'app', { selected: true });

        expect(container.querySelector('circle.circle-node')?.getAttribute('class')).toBe(
            'circle-node component selected special'
        );
        expect(container.querySelector('.circle-overlay')?.getAttribute('stroke-width')).toBe('2');
    });

    it('marks warn and error on the rings only with error highlighting', () => {
        const node = visual({ warn: true, returnsJSX: true });
        const highlight = { ...settings, currentSizeMetricErrorHighlighting: true };

        const off = draw(node);
        const on = inSvg(<GraphNode node={node} view="app" settings={highlight} />);
        const error = inSvg(
            <GraphNode node={visual({ error: true })} view="app" settings={highlight} />
        );

        expect(off.querySelector('.circle-overlay')?.getAttribute('class')).toBe(
            'circle-overlay component'
        );
        expect(on.querySelector('.circle-overlay')?.getAttribute('class')).toBe(
            'circle-overlay component warn'
        );
        expect(on.querySelector('.inner-circle')?.getAttribute('class')).toBe(
            'inner-circle component warn'
        );
        expect(error.querySelector('.circle-overlay')?.getAttribute('class')).toBe(
            'circle-overlay component error'
        );
    });

    it('writes the label, or the id without a label, and one icon per hint below it', () => {
        const container = draw(
            visual({
                icons: [
                    { icon: 'warning', class: 'warn', description: { text: 'Almost too big.' } },
                    { icon: 'device_hub', class: 'error', description: { text: 'Inherits.' } },
                ],
            })
        );

        expect(container.querySelector('tspan.label-text')?.textContent).toBe('App');
        expect(container.querySelector('tspan.icon.warn')?.textContent).toBe('warning');
        expect(
            Array.from(container.querySelectorAll('tspan.icon'), icon => icon.getAttribute('class'))
        ).toEqual(['icon warn', 'icon error']);
        expect(draw(visual({ label: undefined })).querySelector('.label-text')?.textContent).toBe(
            '/app/src/App.js#App'
        );
    });

    it('leaves out the label when the text setting is off', () => {
        const container = inSvg(
            <GraphNode node={visual()} view="app" settings={{ ...settings, text: false }} />
        );

        expect(container.querySelector('text.node-label')).toBeNull();
    });

    it('paints the cluster colours inline', () => {
        const container = inSvg(
            <GraphNode
                node={visual({ width: 48, returnsJSX: true })}
                view="component"
                settings={settings}
                clusterPaint={{ fill: 'rgb(1, 2, 3)', stroke: 'rgb(4, 5, 6)' }}
            />
        );

        const style = (selector: string) =>
            container.querySelector<SVGElement>(selector)?.getAttribute('style');
        expect(style('.circle-node')).toBe('fill: rgb(1, 2, 3);');
        expect(style('.circle-overlay')).toBe('stroke: rgb(4, 5, 6);');
        expect(style('.inner-circle')).toBe('stroke: rgb(4, 5, 6);');
        expect(draw(visual()).querySelector('.circle-node')?.getAttribute('style')).toBeNull();
    });

    it('draws one preview circle per function, hides those that do not fit and adds "..."', () => {
        // Width 20: main radius 3, ring radius 7, circles from index 5 on are hidden.
        const functions = Array.from({ length: 8 }, (_, i) => fn(`f${i}`));
        const container = draw(visual({ width: 20, height: 20, functions }));

        const circles = Array.from(container.querySelectorAll<SVGElement>('circle.function'));
        expect(circles).toHaveLength(8);
        expect(circles.map(circle => circle.style.display === 'none')).toEqual([
            false,
            false,
            false,
            false,
            false,
            true,
            true,
            true,
        ]);
        expect(circles[0]?.querySelector('title')?.textContent).toBe('f0');
        expect(container.querySelector('text.dots')?.getAttribute('class')).toBe(
            'function dots innerFunction'
        );
        expect(container.querySelector('text.dots')?.textContent).toBe('...');
    });

    it('draws no "..." when all preview circles fit, and none in the component view', () => {
        const node = visual({ functions: [fn('a'), fn('b')] });

        expect(draw(node).querySelectorAll('circle.function')).toHaveLength(2);
        expect(draw(node).querySelector('text.dots')).toBeNull();
        expect(draw(node, 'component').querySelector('circle.function')).toBeNull();
    });

    it('keeps the markup of the legacy node', () => {
        const container = draw(
            visual({
                icons: [{ icon: 'warning', class: 'warn', description: { text: 'Too big.' } }],
                functions: [fn('render', { returnsJSX: true, special: true }), fn('handleClick')],
            })
        );

        expect(container.querySelector('g.node')).toMatchInlineSnapshot(`
          <g
            class="node"
            transform="translate(10, 20)"
          >
            <circle
              class="circle-node component"
              r="24"
            />
            <circle
              class="circle-overlay component"
              fill="transparent"
              r="24"
              stroke-width="1"
            />
            <g>
              <circle
                class="function innerFunction jsx special"
                cx="1.7145055188062944e-15"
                cy="-28"
                opacity="0.5"
                r="3"
                stroke-width="1"
              >
                <title>
                  render
                </title>
              </circle>
              <circle
                class="function innerFunction"
                cx="6.927310859126644"
                cy="-27.129547807898053"
                opacity="0.5"
                r="3"
                stroke-width="1"
              >
                <title>
                  handleClick
                </title>
              </circle>
            </g>
            <g />
            <text
              class="node-label"
            >
              <tspan
                class="label-text"
              >
                App
              </tspan>
              <tspan
                dy="1.2em"
                x="0"
              >
                <tspan
                  class="icon warn"
                >
                  warning
                </tspan>
              </tspan>
            </text>
          </g>
        `);
    });
});
