import { analyzeProjectAsync, analyzeWorkspaceAsync, type ProjectFiles } from '@qualivis/core';
import { recordDuration } from '../../lib/perfStats';
import { analysisAtom } from '../../state/analysisAtoms';
import type { StateStore } from '../../state/StateProvider';
import { componentIdAtom, viewModeAtom } from '../../state/viewAtoms';

export type Analyzers = {
    /** The old way: all source files to the legacy core. */
    analyzeProject: typeof analyzeProjectAsync;
    /** One app of a monorepo and the files it reaches (ADR-019). */
    analyzeWorkspace: typeof analyzeWorkspaceAsync;
};

const defaultAnalyzers: Analyzers = {
    analyzeProject: analyzeProjectAsync,
    analyzeWorkspace: analyzeWorkspaceAsync,
};

const errorText = (error: unknown) => (error instanceof Error ? error.message : String(error));

/**
 * Analyses the upload and keeps the store up to date: progress while running, then the result or
 * an error message (ADR-011 A5: the legacy app stopped silently). With an app folder only that
 * app and what it uses, else all source files as before. Never rejects.
 */
export const runAnalysis = async (
    project: ProjectFiles,
    appDir: string | undefined,
    store: StateStore,
    analyzers: Partial<Analyzers> = {}
): Promise<void> => {
    const { analyzeProject, analyzeWorkspace } = { ...defaultAnalyzers, ...analyzers };
    store.set(analysisAtom, {
        status: 'running',
        progress: 0,
        result: undefined,
        error: undefined,
    });
    // The legacy app navigates to /graph right away and shows the progress bar there.
    store.set(viewModeAtom, 'graph');
    store.set(componentIdAtom, undefined);

    const options = {
        onProgress: (progress: number) =>
            store.set(analysisAtom, state => ({ ...state, progress })),
    };
    const startedAt = performance.now();
    try {
        const result = await (appDir === undefined
            ? analyzeProject(project.sources, options)
            : analyzeWorkspace(project, { appDir }, options));
        recordDuration('analysis', performance.now() - startedAt);
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
