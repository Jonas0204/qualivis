// Cluster colours (legacy helper/clusterColorScale.ts, graph.component.ts:317-321), see
// docs/migration/01-referenz-altsystem/03-visuelle-regeln.md §4. The colour maths repeats
// d3.hsl(color), `l += (1 - l) * amount` and toString() of d3-color 1.4 (ISC license), because the
// core does not depend on d3 (ADR-003).
import { clusterColors } from '../model/clusterColors';
import type { View } from './nodeVisuals';

/** Colour of a cluster; from index 20 on every cluster is white (legacy clusterColorScale). */
export const clusterColor = (index: number | string): string => {
    if (Number(index) > clusterColors.length - 1) {
        return 'white';
    }
    return clusterColors[Number(index)];
};

type Rgb = [r: number, g: number, b: number];
type Hsl = { h: number; s: number; l: number };

/** Only '#rrggbb' and 'white' occur (cluster colours). */
const parseColor = (color: string): Rgb => {
    if (color === 'white') {
        return [255, 255, 255];
    }
    const match = /^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(color);
    if (!match) {
        throw new Error(`Unsupported colour: ${color}`);
    }
    return [parseInt(match[1], 16), parseInt(match[2], 16), parseInt(match[3], 16)];
};

/** d3-color hslConvert: hue NaN for greys, saturation NaN for white and black. */
const rgbToHsl = ([red, green, blue]: Rgb): Hsl => {
    const r = red / 255;
    const g = green / 255;
    const b = blue / 255;
    const min = Math.min(r, g, b);
    const max = Math.max(r, g, b);
    let h = Number.NaN;
    let s = max - min;
    const l = (max + min) / 2;
    if (s) {
        if (r === max) {
            h = (g - b) / s + (g < b ? 6 : 0);
        } else if (g === max) {
            h = (b - r) / s + 2;
        } else {
            h = (r - g) / s + 4;
        }
        s /= l < 0.5 ? max + min : 2 - max - min;
        h *= 60;
    } else {
        s = l > 0 && l < 1 ? 0 : h;
    }
    return { h, s, l };
};

/** d3-color hsl2rgb for one channel. */
const channel = (h: number, m1: number, m2: number): number =>
    (h < 60
        ? m1 + ((m2 - m1) * h) / 60
        : h < 180
          ? m2
          : h < 240
            ? m1 + ((m2 - m1) * (240 - h)) / 60
            : m1) * 255;

/** d3-color Hsl.rgb(). */
const hslToRgb = (hsl: Hsl): Rgb => {
    const h = (hsl.h % 360) + (hsl.h < 0 ? 360 : 0);
    const s = Number.isNaN(h) || Number.isNaN(hsl.s) ? 0 : hsl.s;
    const { l } = hsl;
    const m2 = l + (l < 0.5 ? l : 1 - l) * s;
    const m1 = 2 * l - m2;
    return [
        channel(h >= 240 ? h - 240 : h + 120, m1, m2),
        channel(h, m1, m2),
        channel(h < 120 ? h + 240 : h - 120, m1, m2),
    ];
};

/** d3-color rgb formatRgb() for an opaque colour. */
const formatRgb = (rgb: Rgb): string => {
    const [r, g, b] = rgb.map(value => Math.max(0, Math.min(255, Math.round(value) || 0)));
    return `rgb(${r}, ${g}, ${b})`;
};

/**
 * Lightens a colour in HSL by `amount` (0 = unchanged, 1 = white) and returns it as `rgb(r, g, b)`,
 * the same string as d3.hsl(color) with `l += (1 - l) * amount` and toString().
 */
export const brightenColor = (color: string, amount: number): string => {
    const hsl = rgbToHsl(parseColor(color));
    hsl.l += (1 - hsl.l) * amount;
    return formatRgb(hslToRgb(hsl));
};

/** Inline colours of a node with cluster colours on. */
export type ClusterPaint = { fill: string; stroke: string };

/**
 * Cluster colours of a node (legacy updateGraph, graph.component.ts:228-242): the fill of the main
 * circle 75 % and the border of overlay and inner circle 15 % lighter than the cluster colour.
 * Only in the component view, with cluster colours on and for nodes with a cluster.
 */
export const clusterPaint = (
    cluster: number | undefined,
    view: View,
    showCluster: boolean
): ClusterPaint | undefined => {
    if (cluster === undefined || !showCluster || view !== 'component') {
        return undefined;
    }
    // The legacy app passes `cluster.toString()` to the colour scale.
    const color = clusterColor(cluster.toString());
    return { fill: brightenColor(color, 0.75), stroke: brightenColor(color, 0.15) };
};
