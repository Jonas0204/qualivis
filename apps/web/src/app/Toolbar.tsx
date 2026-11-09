import { useSetAtom } from 'jotai';
import { viewModeAtom } from '../state/viewAtoms';
import styles from './Toolbar.module.css';

/** Top bar; the title returns to the upload view and keeps the analysis in memory. */
export const Toolbar = () => {
  const setViewMode = useSetAtom(viewModeAtom);

  return (
    <header className={styles.toolbar}>
      <button type="button" className={styles.title} onClick={() => setViewMode('upload')}>
        Qualivis
      </button>
    </header>
  );
};
