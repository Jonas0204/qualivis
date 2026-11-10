import { atom } from 'jotai';
import { selectViewGraph } from '../features/graph/selectViewGraph';
import { analysisAtom } from './analysisAtoms';

export type ViewMode = 'upload' | 'graph';

export const viewModeAtom = atom<ViewMode>('upload');

export const componentIdAtom = atom<string | undefined>(undefined);

/**
 * Setting "fullScreen" (G13): the graph without the side panels. Its own atom until the
 * settings come in P07.
 */
export const fullScreenAtom = atom(false);

/**
 * Graph of the current view (app or component) and its view. It is the graph of the analysis
 * result, not a copy: GraphView builds the view model, a copy the layout may change.
 */
export const viewGraphAtom = atom(get => {
    const result = get(analysisAtom).result;
    return result ? selectViewGraph(result, get(componentIdAtom)) : undefined;
});
