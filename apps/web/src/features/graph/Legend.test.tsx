import type { View } from '@qualivis/core';
import { describe, expect, it } from 'vitest';
import { renderWithState } from '../../test/renderWithState';
import { GraphDefsContext } from './graphDefsContext';
import { Legend } from './Legend';

const draw = (view: View) => {
    const { container } = renderWithState(<Legend view={view} />);
    return { svg: container.querySelector('svg') };
};

const entries = (svg: Element | null) =>
    Array.from(svg?.querySelectorAll('.legend-entry') ?? [], entry => ({
        y: (entry as SVGGElement).style.transform,
        text: entry.querySelector('.description')?.textContent,
    }));

describe('Legend', () => {
    it('is named by its header', () => {
        const { svg } = draw('app');

        const header = document.getElementById(svg?.getAttribute('aria-labelledby') ?? '');
        expect(header?.textContent).toBe('Legend');
        expect(header?.getAttribute('class')).toBe('legend-header');
    });

    it('lists composition and inheritance in the app view', () => {
        const { svg } = draw('app');

        expect(svg?.getAttribute('height')).toBe('246');
        expect(svg?.getAttribute('viewBox')).toBe('-16 -14 196 246');
        expect(entries(svg)).toEqual([
            { y: 'translateY(32px)', text: 'Function Component' },
            { y: 'translateY(64px)', text: 'Class Component' },
            { y: 'translateY(92px)', text: 'Inner React Function' },
            { y: 'translateY(112px)', text: 'Inner React JSX Function' },
            { y: 'translateY(136px)', text: 'Inner Function' },
            { y: 'translateY(156px)', text: 'Inner JSX Function' },
            { y: 'translateY(180px)', text: 'Composition' },
            { y: 'translateY(200px)', text: 'Inheritance' },
        ]);
    });

    it('lists function use without inheritance in the component view', () => {
        const { svg } = draw('component');

        expect(svg?.getAttribute('height')).toBe('270');
        expect(svg?.getAttribute('viewBox')).toBe('-16 -14 196 270');
        expect(entries(svg).map(({ y }) => y)).toEqual([
            'translateY(32px)',
            'translateY(64px)',
            'translateY(96px)',
            'translateY(128px)',
            'translateY(160px)',
            'translateY(192px)',
            'translateY(224px)',
        ]);
        expect(entries(svg).at(-1)?.text).toBe('Function Use');
    });

    it('uses the hatch and arrow of the graph', () => {
        const { container } = renderWithState(
            <GraphDefsContext value={{ arrowhead: 'qv-arrow-1', hatch: 'qv-hatch-1' }}>
                <Legend view="app" />
            </GraphDefsContext>
        );

        expect(container.querySelector('.circle-overlay[fill]')?.getAttribute('fill')).toBe(
            'url(#qv-hatch-1)'
        );
        expect(
            Array.from(container.querySelectorAll('line'), line => line.getAttribute('marker-end'))
        ).toEqual(['url(#qv-arrow-1)', 'url(#qv-arrow-1)']);
    });

    it('keeps the markup of the legacy legend in the app view', () => {
        expect(draw('app').svg).toMatchInlineSnapshot(`
          <svg
            aria-labelledby="_r_4_"
            class="qv-legend"
            height="246"
            viewBox="-16 -14 196 246"
            width="196"
          >
            <text
              class="legend-header"
              id="_r_4_"
              y="16"
            >
              Legend
            </text>
            <g
              class="legend-entry"
              style="transform: translateY(32px);"
            >
              <circle
                class="circle-node circle-overlay component"
                cx="13"
                cy="12"
                r="12"
              />
              <text
                class="description"
                x="33"
                y="12"
              >
                Function Component
              </text>
            </g>
            <g
              class="legend-entry"
              style="transform: translateY(64px);"
            >
              <circle
                class="circle-node component"
                cx="13"
                cy="12"
                r="12"
              />
              <circle
                class="circle-overlay component"
                cx="13"
                cy="12"
                fill="url(#diagonalHatch)"
                r="12"
              />
              <text
                class="description"
                x="33"
                y="12"
              >
                Class Component
              </text>
            </g>
            <g
              class="legend-entry"
              style="transform: translateY(92px);"
            >
              <circle
                class="function innerFunction special"
                cx="13"
                cy="12"
                opacity="0.5"
                r="5"
              />
              <text
                class="description"
                x="33"
                y="12"
              >
                Inner React Function
              </text>
            </g>
            <g
              class="legend-entry"
              style="transform: translateY(112px);"
            >
              <circle
                class="circle-node circle-overlay innerFunction special jsx function"
                cx="13"
                cy="12"
                opacity="0.5"
                r="5"
              />
              <text
                class="description"
                x="33"
                y="12"
              >
                Inner React JSX Function
              </text>
            </g>
            <g
              class="legend-entry"
              style="transform: translateY(136px);"
            >
              <circle
                class="function innerFunction"
                cx="13"
                cy="12"
                opacity="0.5"
                r="5"
              />
              <text
                class="description"
                x="33"
                y="12"
              >
                Inner Function
              </text>
            </g>
            <g
              class="legend-entry"
              style="transform: translateY(156px);"
            >
              <circle
                class="circle-node circle-overlay innerFunction jsx function"
                cx="13"
                cy="12"
                opacity="0.5"
                r="5"
              />
              <text
                class="description"
                x="33"
                y="12"
              >
                Inner JSX Function
              </text>
            </g>
            <g
              class="legend-entry"
              style="transform: translateY(180px);"
            >
              <line
                marker-end="url(#arrowhead)"
                stroke="#999"
                stroke-opacity="0.6"
                stroke-width="0.8"
                x1="1"
                x2="25"
                y1="12"
                y2="12"
              />
              <text
                class="description"
                x="33"
                y="12"
              >
                Composition
              </text>
            </g>
            <g
              class="legend-entry"
              style="transform: translateY(200px);"
            >
              <line
                marker-end="url(#arrowhead)"
                stroke="#999"
                stroke-dasharray="4 2"
                stroke-opacity="0.6"
                stroke-width="0.8"
                x1="1"
                x2="25"
                y1="12"
                y2="12"
              />
              <text
                class="description"
                x="33"
                y="12"
              >
                Inheritance
              </text>
            </g>
          </svg>
        `);
    });

    it('keeps the markup of the legacy legend in the component view', () => {
        expect(draw('component').svg).toMatchInlineSnapshot(`
          <svg
            aria-labelledby="_r_5_"
            class="qv-legend"
            height="270"
            viewBox="-16 -14 196 270"
            width="196"
          >
            <text
              class="legend-header"
              id="_r_5_"
              y="16"
            >
              Legend
            </text>
            <g
              class="legend-entry"
              style="transform: translateY(32px);"
            >
              <circle
                class="circle-node circle-overlay component"
                cx="13"
                cy="12"
                r="12"
              />
              <text
                class="description"
                x="33"
                y="12"
              >
                Function Component
              </text>
            </g>
            <g
              class="legend-entry"
              style="transform: translateY(64px);"
            >
              <circle
                class="circle-node component"
                cx="13"
                cy="12"
                r="12"
              />
              <circle
                class="circle-overlay component"
                cx="13"
                cy="12"
                fill="url(#diagonalHatch)"
                r="12"
              />
              <text
                class="description"
                x="33"
                y="12"
              >
                Class Component
              </text>
            </g>
            <g
              class="legend-entry"
              style="transform: translateY(96px);"
            >
              <circle
                class="function innerFunction special"
                cx="13"
                cy="12"
                opacity="1"
                r="12"
              />
              <text
                class="description"
                x="33"
                y="12"
              >
                Inner React Function
              </text>
            </g>
            <g
              class="legend-entry"
              style="transform: translateY(128px);"
            >
              <circle
                class="circle-node circle-overlay innerFunction special jsx"
                cx="13"
                cy="12"
                opacity="1"
                r="12"
              />
              <circle
                class="inner-circle innerFunction special"
                cx="13"
                cy="12"
                fill="none"
                r="9"
              />
              <text
                class="description"
                x="33"
                y="12"
              >
                Inner React JSX Function
              </text>
            </g>
            <g
              class="legend-entry"
              style="transform: translateY(160px);"
            >
              <circle
                class="function innerFunction"
                cx="13"
                cy="12"
                opacity="1"
                r="12"
              />
              <text
                class="description"
                x="33"
                y="12"
              >
                Inner Function
              </text>
            </g>
            <g
              class="legend-entry"
              style="transform: translateY(192px);"
            >
              <circle
                class="circle-node circle-overlay innerFunction jsx"
                cx="13"
                cy="12"
                opacity="1"
                r="12"
              />
              <circle
                class="inner-circle innerFunction"
                cx="13"
                cy="12"
                fill="none"
                r="9"
              />
              <text
                class="description"
                x="33"
                y="12"
              >
                Inner JSX Function
              </text>
            </g>
            <g
              class="legend-entry"
              style="transform: translateY(224px);"
            >
              <line
                marker-end="url(#arrowhead)"
                stroke="#999"
                stroke-opacity="0.6"
                stroke-width="0.8"
                x1="1"
                x2="25"
                y1="12"
                y2="12"
              />
              <text
                class="description"
                x="33"
                y="12"
              >
                Function Use
              </text>
            </g>
          </svg>
        `);
    });
});
