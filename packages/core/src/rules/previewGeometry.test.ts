import { describe, expect, it } from 'vitest';
import { readGolden } from '../../test/golden/loadFixture';
import type { Graph, Node } from '../model/graph';
import {
    indexAngle,
    mainRadius,
    outerRadius,
    previewCircles,
    previewDots,
    previewWidth,
} from './previewGeometry';

type DomNode = {
    id: string;
    width: number;
    dom: {
        previews: { cls: string; title: string; hidden: boolean; cx: number; cy: number }[];
        dots: { x: number; y: number }[];
    };
};

const fn = (id: string, extra: Partial<Node> = {}): Node => ({
    id,
    type: 'innerFunction',
    ...extra,
});
const functions = (count: number) => Array.from({ length: count }, (_, i) => fn(`f${i}`));

describe('radii', () => {
    it('subtracts the preview width of 14 only in the app view', () => {
        expect(previewWidth).toBe(14);
        expect(mainRadius(48, 'component')).toBe(24);
        expect(mainRadius(62, 'app')).toBe(24);
    });

    it('puts the preview ring 4 outside the main circle', () => {
        expect(outerRadius(62, 'app')).toBe(28);
        expect(outerRadius(48, 'component')).toBe(28);
    });

    it('spaces the preview circles by 7 along the ring', () => {
        expect(indexAngle(2, 7)).toBe(2);
        expect(indexAngle(3, 14)).toBe(1.5);
    });
});

describe('previewCircles', () => {
    it('matches the preview circles of App in the legacy app view (mini)', () => {
        const dom = readGolden('mini', 'legacy-dom-app.json') as { nodes: DomNode[] };
        const graph = readGolden('mini', 'legacy-appgraph.json') as Graph;
        const domApp = dom.nodes.find(n => n.id === '/mini/src/App.js#App');
        const app = graph.nodes.find(n => n.id === '/mini/src/App.js#App');
        if (!domApp || !app?.functions) throw new Error('App not found in the golden data');

        const circles = previewCircles(domApp.width, app.functions);

        expect(circles).toHaveLength(10);
        circles.forEach((circle, i) => {
            const legacy = domApp.dom.previews[i];
            expect(circle.id).toBe(legacy?.title);
            expect(circle.className).toBe(legacy?.cls);
            expect(circle.hidden).toBe(legacy?.hidden);
            expect(Math.abs(circle.cx - (legacy?.cx ?? Number.NaN))).toBeLessThanOrEqual(1e-9);
            expect(Math.abs(circle.cy - (legacy?.cy ?? Number.NaN))).toBeLessThanOrEqual(1e-9);
        });
        expect(domApp.dom.dots).toEqual([]);
        expect(previewDots(domApp.width, app.functions)).toBeUndefined();
    });

    it('builds the class from type, JSX and special', () => {
        const [circle] = previewCircles(54, [fn('render', { returnsJSX: true, special: true })]);
        expect(circle?.className).toBe('function innerFunction jsx special');
    });

    it('hides a circle when the next but one would pass a full turn', () => {
        // Width 20 (node without report): main radius 3, ring radius 7, so circle i is at angle i.
        const hidden = previewCircles(20, functions(8)).map(c => c.hidden);
        expect(hidden).toEqual([false, false, false, false, false, true, true, true]);
    });
});

describe('previewDots', () => {
    it('gives a position exactly when a circle is hidden', () => {
        for (let count = 0; count <= 8; count++) {
            const anyHidden = previewCircles(20, functions(count)).some(c => c.hidden);
            expect(previewDots(20, functions(count)) !== undefined).toBe(anyHidden);
        }
    });

    it('sits at the first hidden circle', () => {
        const firstHidden = previewCircles(20, functions(8)).find(c => c.hidden);
        expect(previewDots(20, functions(8))).toEqual({ x: firstHidden?.cx, y: firstHidden?.cy });
    });
});
