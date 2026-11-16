import { useSetAtom } from 'jotai';
import { Button } from '../../../../common-components';
import { viewModeAtom } from '../state/viewAtoms';
import styles from './Toolbar.module.css';

/** Top bar; the title returns to the upload view and keeps the analysis in memory. */
export const Toolbar = () => {
    const setViewMode = useSetAtom(viewModeAtom);

    return (
        <header className={styles.toolbar}>
            <Button className={styles.title} onClick={() => setViewMode('upload')}>
                Qualivis
            </Button>
        </header>
    );
};
