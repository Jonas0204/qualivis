import { useState } from 'react';
import { Button, Card, Field, Input, Select, Textarea } from '../../index';

const metrics = [
    { value: 'loc', label: 'Lines of code' },
    { value: 'cyclomatic', label: 'Cyclomatic complexity' },
    { value: 'maintainability', label: 'Maintainability' },
    { value: 'halstead', label: 'Halstead effort', disabled: true },
];

/** Field with Input, Select and Textarea; one field shows an error. */
export const FormSection = () => {
    const [folder, setFolder] = useState('src/app');
    return (
        <Card
            title="Text fields"
            description="Field, Label, Input, Select, Textarea"
            footer={
                <>
                    <Button>Reset</Button>
                    <Button variant="primary">Save view</Button>
                </>
            }
        >
            <div className="sc-stack">
                <Field label="Search files" hint="Matches file names and folders.">
                    {props => <Input {...props} icon="search" placeholder="e.g. GraphView" />}
                </Field>
                <Field
                    label="App folder"
                    error={folder.trim() === '' ? 'Choose the folder of the app.' : undefined}
                >
                    {props => (
                        <Input
                            {...props}
                            value={folder}
                            onChange={event => setFolder(event.currentTarget.value)}
                        />
                    )}
                </Field>
                <Field label="Node size metric">
                    {({ invalid, ...props }) => (
                        <Select {...props} invalid={invalid} options={metrics} defaultValue="loc" />
                    )}
                </Field>
                <Field label="Notes" hint="Saved with the view.">
                    {props => <Textarea {...props} placeholder="What stands out in this graph?" />}
                </Field>
            </div>
        </Card>
    );
};
