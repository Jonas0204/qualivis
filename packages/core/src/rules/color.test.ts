import { describe, expect, it } from 'vitest';
import { readGolden } from '../../test/golden/loadFixture';
import { brightenColor, clusterColor, clusterPaint } from './color';

type ClusterColors = { colors: { id: string; cluster: number; fill: string; stroke: string }[] };

describe('clusterColor', () => {
    it('uses the legacy palette, also for string indexes', () => {
        expect(clusterColor(0)).toBe('#8321d9');
        expect(clusterColor('3')).toBe('#1d5ebf');
        expect(clusterColor(19)).toBe('#4b5573');
    });

    it('is white from index 20 on', () => {
        expect(clusterColor(20)).toBe('white');
        expect(clusterColor('25')).toBe('white');
    });
});

describe('brightenColor', () => {
    it('gives the same fill and stroke as the legacy app (mini, component view of App)', () => {
        const { colors } = readGolden('mini', 'legacy-cluster-colors.json') as ClusterColors;
        expect(colors.length).toBeGreaterThan(0);
        for (const { cluster, fill, stroke } of colors) {
            // The legacy app passes `cluster.toString()` to the colour scale.
            const color = clusterColor(cluster.toString());
            expect(brightenColor(color, 0.75)).toBe(fill);
            expect(brightenColor(color, 0.15)).toBe(stroke);
        }
    });

    it('keeps white white', () => {
        expect(brightenColor('white', 0.75)).toBe('rgb(255, 255, 255)');
    });

    it('returns the colour itself as rgb when nothing is added', () => {
        expect(brightenColor('#d92121', 0)).toBe('rgb(217, 33, 33)');
    });

    it('rejects colour formats that do not occur', () => {
        expect(() => brightenColor('red', 0.5)).toThrow('Unsupported colour: red');
    });
});

describe('clusterPaint', () => {
    it('paints a node of the component view like the legacy app', () => {
        const { colors } = readGolden('mini', 'legacy-cluster-colors.json') as ClusterColors;
        for (const { cluster, fill, stroke } of colors) {
            expect(clusterPaint(cluster, 'component', true)).toEqual({ fill, stroke });
        }
    });

    it('paints nothing without cluster colours, in the app view or without a cluster', () => {
        expect(clusterPaint(1, 'component', false)).toBeUndefined();
        expect(clusterPaint(1, 'app', true)).toBeUndefined();
        expect(clusterPaint(undefined, 'component', true)).toBeUndefined();
    });

    it('paints cluster 0, which is falsy', () => {
        expect(clusterPaint(0, 'component', true)?.fill).toBe(brightenColor('#8321d9', 0.75));
    });
});
