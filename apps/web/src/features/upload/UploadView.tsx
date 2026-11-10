import { findAppCandidates, type ProjectFiles, type WorkspacePackage } from '@qualivis/core';
import { type ChangeEvent, useState } from 'react';
import { Icon } from '../../ui/Icon';
import { logReadError } from './logReadError';
import { ProjectChoice } from './ProjectChoice';
import { readInputFiles } from './readInputFiles';
import styles from './UploadView.module.css';
import { useFileDrop } from './useFileDrop';

type UploadViewProps = {
    /** The upload, with the chosen app folder of a monorepo; without one, all files (old way). */
    onFiles: (project: ProjectFiles, appDir?: string) => void;
    /** Shown below the card until the snackbar exists (P07). */
    error?: string | undefined;
};

type PendingChoice = { project: ProjectFiles; candidates: WorkspacePackage[] };

// React does not type the non-standard folder-selection attribute.
const folderSelection = { webkitdirectory: '' };

export const UploadView = ({ onFiles, error }: UploadViewProps) => {
    const [pending, setPending] = useState<PendingChoice>();

    // With at least two app candidates the user chooses first (ADR-019); else as before.
    const receive = (project: ProjectFiles) => {
        const candidates = findAppCandidates(project);
        if (candidates.length >= 2) {
            setPending({ project, candidates });
        } else {
            onFiles(project);
        }
    };

    const { isDraggingOver, handlers } = useFileDrop(receive);

    const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
        const { files } = event.currentTarget;
        if (files) {
            void readInputFiles(files).then(receive, logReadError);
        }
    };

    const handleAnalyze = (appDir: string | undefined) => {
        if (!pending) {
            return;
        }
        setPending(undefined);
        if (appDir === undefined) {
            onFiles(pending.project);
        } else {
            onFiles(pending.project, appDir);
        }
    };

    const cardClassName = isDraggingOver
        ? `${styles.card} ${styles.dragging} is-dragging-over`
        : styles.card;

    return (
        <div className={styles.view}>
            {pending ? (
                <ProjectChoice
                    candidates={pending.candidates}
                    onAnalyze={handleAnalyze}
                    onCancel={() => setPending(undefined)}
                />
            ) : (
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
            )}
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
