import { createStore } from 'jotai';
import { describe, expect, it } from 'vitest';
import { componentIdAtom, viewModeAtom } from './viewAtoms';

describe('viewAtoms', () => {
  it('starts on the upload view with no component selected', () => {
    const store = createStore();
    expect(store.get(viewModeAtom)).toBe('upload');
    expect(store.get(componentIdAtom)).toBeUndefined();
  });

  it('stores the view mode and component id', () => {
    const store = createStore();
    store.set(viewModeAtom, 'graph');
    store.set(componentIdAtom, 'src/App.js');
    expect(store.get(viewModeAtom)).toBe('graph');
    expect(store.get(componentIdAtom)).toBe('src/App.js');
  });
});
