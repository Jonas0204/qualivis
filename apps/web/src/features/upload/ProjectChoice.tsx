import type { WorkspacePackage } from '@qualivis/core';
import { useState } from 'react';
import { Button } from '../../ui/Button';
import { Select } from '../../ui/Select';
import styles from './ProjectChoice.module.css';

type ProjectChoiceProps = {
    /** App folder candidates, sorted by dir (findAppCandidates). */
    candidates: readonly WorkspacePackage[];
    /** The chosen app folder, or undefined for "Whole project". */
    onAnalyze: (appDir: string | undefined) => void;
    onCancel: () => void;
};

const wholeProject = { value: '', label: 'Whole project' };

/** Asks which folder of a monorepo upload is the app (ADR-019); "Whole project" is preselected. */
export const ProjectChoice = ({ candidates, onAnalyze, onCancel }: ProjectChoiceProps) => {
    const [appDir, setAppDir] = useState('');
    const options = [
        wholeProject,
        ...candidates.map(({ dir, name }) => ({
            value: dir,
            label: name === undefined ? dir : `${name} (${dir})`,
        })),
    ];

    return (
        <section className={styles.card} aria-labelledby="project-choice-title">
            <h2 id="project-choice-title" className={styles.title}>
                Which folder is the app?
            </h2>
            <p className={styles.hint}>Only the files the app uses are analysed.</p>
            <Select
                aria-label="App folder"
                className={styles.select}
                value={appDir}
                options={options}
                onChange={setAppDir}
            />
            <div className={styles.actions}>
                <Button onClick={onCancel}>Cancel</Button>
                <Button
                    variant="raised"
                    color="primary"
                    onClick={() => onAnalyze(appDir === '' ? undefined : appDir)}
                >
                    Analyze
                </Button>
            </div>
        </section>
    );
};
