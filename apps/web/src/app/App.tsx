import { useAtomValue } from 'jotai';
import { UploadView } from '../features/upload/UploadView';
import { viewModeAtom } from '../state/viewAtoms';
import { AppShell } from './AppShell';

// The selected files are not analysed yet; the analysis flow follows in P04-S04.
const ignoreFiles = () => undefined;

export const App = () => {
  const viewMode = useAtomValue(viewModeAtom);

  return <AppShell>{viewMode === 'upload' && <UploadView onFiles={ignoreFiles} />}</AppShell>;
};
