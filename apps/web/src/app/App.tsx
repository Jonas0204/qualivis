import type { SourceFile } from '@qualivis/core';
import { useAtomValue, useStore } from 'jotai';
import { runAnalysis } from '../features/analysis/runAnalysis';
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

  const handleFiles = (files: SourceFile[]) => {
    void runAnalysis(files, store);
  };

  return (
    <AppShell>
      {progress !== undefined && <ProgressBar value={progress} />}
      {viewMode === 'upload' && <UploadView onFiles={handleFiles} error={error} />}
    </AppShell>
  );
};
