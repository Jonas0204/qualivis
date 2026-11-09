import { atom } from 'jotai';
import { buildViewGraph } from '../features/graph/buildViewGraph';
import { analysisAtom } from './analysisAtoms';

export type ViewMode = 'upload' | 'graph';

export const viewModeAtom = atom<ViewMode>('upload');

export const componentIdAtom = atom<string | undefined>(undefined);

/** Graph of the current view (app or component), a fresh copy whenever result or id change. */
export const viewGraphAtom = atom(get => {
    const result = get(analysisAtom).result;
    return result ? buildViewGraph(result, get(componentIdAtom)) : undefined;
});
