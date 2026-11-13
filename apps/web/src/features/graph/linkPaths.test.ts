import type { VisualLink, VisualNode } from '@qualivis/core';
import { describe, expect, it } from 'vitest';
import { bundleLinks, linkPathData } from './linkPaths';

const node = (id: string, x: number, y: number): VisualNode => ({
    id,
    x,
    y,
    width: 48,
    height: 48,
    warn: false,
    error: false,
});

const a = node('a', 0, 0);
const b = node('b', 100, 0);
const c = node('c', 0, 200);

describe('bundleLinks', () => {
    const solid: VisualLink = { source: a, target: b };
    const dashed: VisualLink = { source: a, target: c, inherits: true };
    const other: VisualLink = { source: b, target: c };

    it('keeps all links and parts the dashed ones while nothing is faded', () => {
        expect(bundleLinks([solid, dashed, other])).toEqual({
            kept: { solid: [solid, other], dashed: [dashed] },
            rest: { solid: [], dashed: [] },
        });
    });

    it('keeps only the links that stay visible while the graph is faded', () => {
        expect(bundleLinks([solid, dashed, other], new Set([dashed]))).toEqual({
            kept: { solid: [], dashed: [dashed] },
            rest: { solid: [solid, other], dashed: [] },
        });
    });
});

describe('linkPathData', () => {
    it('draws each line like GraphLink and each head like the arrow marker', () => {
        const { lines, heads } = linkPathData([{ source: a, target: b }], 'component', 0.8);

        // Radius 24 plus half the stroke: the line ends 24.5 before the target centre.
        expect(lines).toBe('M0,0L75.5,0');
        // The marker is 8 stroke widths large, so one of its 10 units is 0.64: the triangle is 6.4
        // long and 6.4 wide, and its point lies one unit behind the end of the line.
        expect(heads).toBe('M69.74,3.2L76.14,0L69.74,-3.2Z');
    });

    it('points the head along the line', () => {
        const { lines, heads } = linkPathData([{ source: a, target: c }], 'component', 0.8);

        expect(lines).toBe('M0,0L0,175.5');
        expect(heads).toBe('M-3.2,169.74L0,176.14L3.2,169.74Z');
    });

    it('makes the heads smaller with the lines, as the marker does while zooming in', () => {
        const { heads } = linkPathData([{ source: a, target: b }], 'component', 0.4);

        expect(heads).toBe('M72.62,1.6L75.82,0L72.62,-1.6Z');
    });

    it('joins all links in one path each', () => {
        const { lines, heads } = linkPathData(
            [
                { source: a, target: b },
                { source: a, target: c },
            ],
            'component',
            0.8
        );

        expect(lines).toBe('M0,0L75.5,0M0,0L0,175.5');
        expect(heads.match(/Z/g)).toHaveLength(2);
    });

    it('leaves out a link whose ends are on the same spot, which GraphLink hides', () => {
        expect(linkPathData([{ source: a, target: node('onA', 0, 0) }], 'component', 0.8)).toEqual({
            lines: '',
            heads: '',
        });
    });

    it('leaves out the links outside of the area', () => {
        const links = [
            { source: a, target: b },
            { source: c, target: node('d', 100, 200) },
        ];

        const area = { x: -10, y: -10, width: 200, height: 100 };
        expect(linkPathData(links, 'component', 0.8, area).lines).toBe('M0,0L75.5,0');
        // A link that only crosses the area stays.
        expect(
            linkPathData(links, 'component', 0.8, { x: 40, y: 190, width: 20, height: 20 }).lines
        ).toBe('M0,200L75.5,200');
    });
});
