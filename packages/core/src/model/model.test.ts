import { describe, expect, it } from 'vitest';
import { qualityMetrics, sizeConstant, warningThreshold } from './qualityMetrics';
import { defaultSettings } from './settings';
import { reactMethods } from './specialMethods';

describe('qualityMetrics', () => {
  it('lists the seven metrics in the legacy order (drives icon and panel order)', () => {
    expect(Object.keys(qualityMetrics)).toEqual([
      'sloc.physical',
      'sloc.jsx',
      'maxJsxNesting',
      'cyclomatic',
      'halstead.difficulty',
      'halstead.bugs',
      'paramCount',
    ]);
  });

  it('warns at 80 % of a threshold and sizes a node at its threshold to area 16000', () => {
    expect(warningThreshold).toBe(0.8);
    expect(sizeConstant).toBe(16000);
  });
});

describe('reactMethods', () => {
  it('orders the x-axis from constructor to render over all 16 special methods', () => {
    expect(reactMethods[0]).toBe('constructor');
    expect(reactMethods.at(-1)).toBe('render');
    expect(reactMethods).toHaveLength(16);
  });
});

describe('defaultSettings', () => {
  it('matches the legacy defaults', () => {
    expect(defaultSettings).toEqual({
      colaLayout: true,
      hideOverlappingLabels: true,
      fade: true,
      highlightIndirectNodes: true,
      currentSizeMetricErrorHighlighting: false,
      autoZoom: true,
      nodeSizesBasedOnMetrics: true,
      text: true,
      fullScreen: false,
    });
  });
});
