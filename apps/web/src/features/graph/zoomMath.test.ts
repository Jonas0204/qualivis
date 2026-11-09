import { describe, expect, it } from 'vitest';
import {
    easeCubicInOut,
    fitTransform,
    identityTransform,
    interpolateTransform,
    invert,
    labelFontSize,
    linkStrokeWidth,
    nextZoomStyle,
    transformAttribute,
    translateTo,
    wheelFactor,
    zoomAt,
    zoomLevel,
} from './zoomMath';

const screen = (
    transform: { k: number; x: number; y: number },
    point: { x: number; y: number }
) => ({
    x: point.x * transform.k + transform.x,
    y: point.y * transform.k + transform.y,
});

describe('fitTransform', () => {
    it('fills 95 % of the viewport and centres the graph', () => {
        const fit = fitTransform(
            { x: 0, y: 0, width: 200, height: 100 },
            { width: 400, height: 400 }
        );

        // k = min(0.95 / max(200 / 400, 100 / 400), 3) = 1.9; centre (100, 50) to (200, 200).
        expect(fit).toEqual({ k: 1.9, x: 200 - 1.9 * 100, y: 200 - 1.9 * 50 });
    });

    it('scales a small graph at most 3 times', () => {
        expect(
            fitTransform({ x: 0, y: 0, width: 10, height: 10 }, { width: 400, height: 400 })?.k
        ).toBe(3);
    });

    it('takes the forced scale and still centres the graph (zoom to 100 %)', () => {
        const fit = fitTransform(
            { x: -50, y: 20, width: 200, height: 100 },
            { width: 400, height: 300 },
            0.95,
            1
        );

        expect(fit).toEqual({ k: 1, x: 200 - 50, y: 150 - 70 });
    });

    it('has nothing to fit without width or height', () => {
        const viewport = { width: 400, height: 400 };

        expect(fitTransform({ x: 5, y: 5, width: 0, height: 100 }, viewport)).toBeUndefined();
        expect(
            fitTransform({ x: 5, y: 5, width: 100, height: 0 }, viewport, 0.95, 1)
        ).toBeUndefined();
    });
});

describe('zoomAt', () => {
    it('keeps the graph point under the pointer in place', () => {
        const before = { k: 1.5, x: 40, y: -20 };
        const pointer = { x: 230, y: 115 };
        const under = invert(before, pointer);

        const after = zoomAt(before, pointer, 2);

        expect(after.k).toBe(3);
        expect(screen(after, under).x).toBeCloseTo(pointer.x, 9);
        expect(screen(after, under).y).toBeCloseTo(pointer.y, 9);
    });
});

describe('translateTo', () => {
    it('moves the grabbed graph point under the pointer at the same scale (pan)', () => {
        const before = { k: 2, x: 10, y: 20 };
        const grabbed = invert(before, { x: 100, y: 100 });

        const after = translateTo(before, { x: 130, y: 90 }, grabbed);

        expect(after).toEqual({ k: 2, x: 40, y: 10 });
    });
});

describe('invert', () => {
    it('turns a screen point into graph coordinates', () => {
        expect(invert({ k: 2, x: 10, y: 20 }, { x: 30, y: 60 })).toEqual({ x: 10, y: 20 });
    });
});

describe('wheelFactor', () => {
    it('zooms like d3-zoom per pixel, line and page', () => {
        expect(wheelFactor(-500, 0)).toBe(2);
        expect(wheelFactor(-20, 1)).toBe(2);
        expect(wheelFactor(1, 2)).toBe(0.5);
        expect(wheelFactor(0, 0)).toBe(1);
    });
});

describe('zoomLevel', () => {
    it('rounds the scale to whole percent', () => {
        expect(zoomLevel(1)).toBe(100);
        expect(zoomLevel(0.5004)).toBe(50);
        expect(zoomLevel(1.9)).toBe(190);
    });
});

describe('labelFontSize and linkStrokeWidth', () => {
    it('cap the label at 20 px on screen and leave it below', () => {
        expect(labelFontSize(2)).toBe(10);
        expect(labelFontSize(1)).toBeUndefined();
        expect(labelFontSize(1.4)).toBeUndefined();
        expect(labelFontSize(1.5)).toBeCloseTo(20 / 1.5, 12);
    });

    it('cap the link at 1.6 on screen and leave it below', () => {
        expect(linkStrokeWidth(4)).toBe(0.4);
        expect(linkStrokeWidth(2)).toBeUndefined();
    });
});

describe('nextZoomStyle', () => {
    it('keeps the smaller sizes when zooming out again (V5)', () => {
        const zoomedIn = nextZoomStyle({}, 4);
        expect(zoomedIn).toEqual({ labelFontSize: 5, linkStrokeWidth: 0.4 });

        expect(nextZoomStyle(zoomedIn, 1)).toBe(zoomedIn);
        // Between the two limits only the label changes.
        expect(nextZoomStyle(zoomedIn, 1.6)).toEqual({ labelFontSize: 12.5, linkStrokeWidth: 0.4 });
    });

    it('stays untouched below both limits', () => {
        const style = {};

        expect(nextZoomStyle(style, 1)).toBe(style);
    });
});

describe('transformAttribute', () => {
    it('writes the transform like d3', () => {
        expect(transformAttribute(identityTransform)).toBe('translate(0,0) scale(1)');
        expect(transformAttribute({ k: 0.5, x: 25, y: -150.5 })).toBe(
            'translate(25,-150.5) scale(0.5)'
        );
    });
});

describe('easeCubicInOut and interpolateTransform', () => {
    it('ease slowly in and out like d3.easeCubicInOut', () => {
        expect(easeCubicInOut(0)).toBe(0);
        expect(easeCubicInOut(0.25)).toBe(0.0625);
        expect(easeCubicInOut(0.5)).toBe(0.5);
        expect(easeCubicInOut(0.75)).toBe(0.9375);
        expect(easeCubicInOut(1)).toBe(1);
    });

    it('interpolate scale and translation linearly', () => {
        expect(interpolateTransform({ k: 1, x: 0, y: 0 }, { k: 3, x: 100, y: -50 }, 0.5)).toEqual({
            k: 2,
            x: 50,
            y: -25,
        });
    });
});
