import type { ProjectFiles } from '@qualivis/core';
import type { ChangeEvent } from 'react';
import { Icon } from '../../ui/Icon';
import { logReadError } from './logReadError';
import { readInputFiles } from './readInputFiles';
import styles from './UploadView.module.css';
import { useFileDrop } from './useFileDrop';

type UploadViewProps = {
    onFiles: (project: ProjectFiles) => void;
    /** Shown below the card until the snackbar exists (P07). */
    error?: string | undefined;
};

// React does not type the non-standard folder-selection attribute.
const folderSelection = { webkitdirectory: '' };

export const UploadView = ({ onFiles, error }: UploadViewProps) => {
    const { isDraggingOver, handlers } = useFileDrop(onFiles);

    const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
        const { files } = event.currentTarget;
        if (files) {
            void readInputFiles(files).then(onFiles, logReadError);
        }
    };

    const cardClassName = isDraggingOver
        ? `${styles.card} ${styles.dragging} is-dragging-over`
        : styles.card;

    return (
        <div className={styles.view}>
            <div className={cardClassName} {...handlers}>
                <label htmlFor="file-upload" className={styles.button}>
                    <Icon name="note_add" size={104} />
                    <span className={styles.text}>
                        Drag and drop <br />
                        or <br />
                        browse a folder
                    </span>
                </label>
            </div>
            {error && (
                <p role="alert" className={styles.error}>
                    {error}
                </p>
            )}
            <input
                type="file"
                id="file-upload"
                name="file-upload"
                className={styles.input}
                onChange={handleChange}
                multiple
                {...folderSelection}
            />
        </div>
    );
};
