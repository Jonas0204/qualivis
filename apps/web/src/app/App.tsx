import type { ProjectFiles } from '@qualivis/core';
import { useAtomValue, useStore } from 'jotai';
import { runAnalysis } from '../features/analysis/runAnalysis';
import { GraphView } from '../features/graph/GraphView';
import { UploadView } from '../features/upload/UploadView';
import { analysisErrorAtom, analysisProgressAtom } from '../state/analysisAtoms';
import { viewModeAtom } from '../state/viewAtoms';
import { ProgressBar } from '../ui/ProgressBar';
import { AppShell } from './AppShell';

export const App = () => {
    const store = useStore();
    const viewMode = useAtomValue(viewModeAtom);
    const progress = useAtomValue(analysisProgressAtom);
    const error = useAtomValue(analysisErrorAtom);

    const handleFiles = (project: ProjectFiles, appDir?: string) => {
        void runAnalysis(project, appDir, store);
    };

    return (
        <AppShell>
            {/* The legacy progress bar is part of the graph view (graph-view.component.html:2). */}
            {viewMode === 'graph' && progress !== undefined && <ProgressBar value={progress} />}
            {viewMode === 'upload' && <UploadView onFiles={handleFiles} error={error} />}
            {viewMode === 'graph' && <GraphView />}
        </AppShell>
    );
};
