import { analyzeProjectAsync, type SourceFile } from '@qualivis/core';
import { analysisAtom } from '../../state/analysisAtoms';
import type { StateStore } from '../../state/StateProvider';
import { componentIdAtom, viewModeAtom } from '../../state/viewAtoms';

const errorText = (error: unknown) => (error instanceof Error ? error.message : String(error));

/**
 * Analyses the files and keeps the store up to date: progress while running, then the result or
 * an error message (ADR-011 A5: the legacy app stopped silently). Never rejects.
 */
export const runAnalysis = async (
    files: SourceFile[],
    store: StateStore,
    analyze = analyzeProjectAsync
): Promise<void> => {
    store.set(analysisAtom, {
        status: 'running',
        progress: 0,
        result: undefined,
        error: undefined,
    });
    // The legacy app navigates to /graph right away and shows the progress bar there.
    store.set(viewModeAtom, 'graph');
    store.set(componentIdAtom, undefined);

    try {
        const result = await analyze(files, {
            onProgress: progress => store.set(analysisAtom, state => ({ ...state, progress })),
        });
        store.set(analysisAtom, { status: 'done', progress: undefined, result, error: undefined });
    } catch (error) {
        store.set(analysisAtom, {
            status: 'error',
            progress: undefined,
            result: undefined,
            error: `Analysis failed: ${errorText(error)}`,
        });
        store.set(viewModeAtom, 'upload');
    }
};
