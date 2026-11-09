import type { AnalysisResult, AnalyzeAsyncOptions, SourceFile } from '@qualivis/core';
import { createStore } from 'jotai';
import { describe, expect, it } from 'vitest';
import { type AnalysisState, analysisAtom } from '../../state/analysisAtoms';
import { componentIdAtom, viewModeAtom } from '../../state/viewAtoms';
import { loadFixture } from '../../test/fixtures';
import { runAnalysis } from './runAnalysis';

const files: SourceFile[] = [{ path: '/app/src/App.js', code: 'export default () => null;' }];
const fakeResult = { fileMap: {}, appGraph: { nodes: [], links: [] } } as unknown as AnalysisResult;

const recordAnalysisStates = (store: ReturnType<typeof createStore>) => {
  const states: AnalysisState[] = [];
  store.sub(analysisAtom, () => states.push(store.get(analysisAtom)));
  return states;
};

describe('runAnalysis', () => {
  it('reports progress, stores the result and switches to the graph view', async () => {
    const store = createStore();
    store.set(componentIdAtom, '/app/src/Old.js');
    const states = recordAnalysisStates(store);
    const analyze = async (_files: readonly SourceFile[], options?: AnalyzeAsyncOptions) => {
      options?.onProgress?.(50);
      options?.onProgress?.(100);
      return fakeResult;
    };

    await runAnalysis(files, store, analyze);

    expect(states.map(state => [state.status, state.progress])).toEqual([
      ['running', 0],
      ['running', 50],
      ['running', 100],
      ['done', undefined],
    ]);
    expect(store.get(analysisAtom).result).toBe(fakeResult);
    expect(store.get(viewModeAtom)).toBe('graph');
    expect(store.get(componentIdAtom)).toBeUndefined();
  });

  it('stores an error message and returns to the upload view when the analysis fails', async () => {
    const store = createStore();
    const analyze = () => Promise.reject(new SyntaxError('Unexpected token (3:4)'));

    await runAnalysis(files, store, analyze);

    expect(store.get(analysisAtom)).toEqual({
      status: 'error',
      progress: undefined,
      result: undefined,
      error: 'Analysis failed: Unexpected token (3:4)',
    });
    expect(store.get(viewModeAtom)).toBe('upload');
  });

  it('analyses the mini fixture with the real core', async () => {
    const store = createStore();

    await runAnalysis(loadFixture('mini'), store);

    const { status, result } = store.get(analysisAtom);
    expect(status).toBe('done');
    expect(result?.appGraph.nodes).toHaveLength(8);
  });
});
