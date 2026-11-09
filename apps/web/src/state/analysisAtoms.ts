import type { AnalysisResult } from '@qualivis/core';
import { atom } from 'jotai';

export type AnalysisStatus = 'idle' | 'running' | 'done' | 'error';

export type AnalysisState = {
  status: AnalysisStatus;
  /** `undefined` hides the progress bar, as in the legacy app. */
  progress: number | undefined;
  result: AnalysisResult | undefined;
  error: string | undefined;
};

export const initialAnalysisState: AnalysisState = {
  status: 'idle',
  progress: undefined,
  result: undefined,
  error: undefined,
};

export const analysisAtom = atom<AnalysisState>(initialAnalysisState);

/** Only the progress value, so components re-render only when it changes. */
export const analysisProgressAtom = atom(get => get(analysisAtom).progress);
