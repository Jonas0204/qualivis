import { atom } from 'jotai';

export type ViewMode = 'upload' | 'graph';

export const viewModeAtom = atom<ViewMode>('upload');

export const componentIdAtom = atom<string | undefined>(undefined);
