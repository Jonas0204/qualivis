import type { WorkspacePackage } from '@qualivis/core';
import { useState } from 'react';
import { Button, Card, Field, Select } from '../../../../../common-components';
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
        <Card
            className={styles.card}
            title="Which folder is the app?"
            description="Only the files the app uses are analysed."
            footer={
                <>
                    <Button variant="outline" onClick={onCancel}>
                        Cancel
                    </Button>
                    <Button
                        variant="primary"
                        onClick={() => onAnalyze(appDir === '' ? undefined : appDir)}
                    >
                        Analyze
                    </Button>
                </>
            }
        >
            <Field label="App folder">
                {props => (
                    <Select
                        {...props}
                        value={appDir}
                        options={options}
                        onChange={event => setAppDir(event.currentTarget.value)}
                    />
                )}
            </Field>
        </Card>
    );
};
