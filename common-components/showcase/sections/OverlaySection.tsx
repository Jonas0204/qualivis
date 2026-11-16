import { useState } from 'react';
import {
    Button,
    Card,
    Dialog,
    DropdownMenu,
    Field,
    Icon,
    Input,
    Popover,
    Sheet,
    Switch,
    Toast,
    Tooltip,
} from '../../index';

/** Popover, DropdownMenu, Dialog, alert Dialog, Sheet, Toast, Tooltip. */
export const OverlaySection = () => {
    const [dialog, setDialog] = useState(false);
    const [confirm, setConfirm] = useState(false);
    const [sheet, setSheet] = useState(false);
    const [toast, setToast] = useState(false);
    const closeToast = () => setToast(false);

    return (
        <Card title="Overlays" description="Popover, DropdownMenu, Dialog, Sheet, Toast, Tooltip">
            <div className="sc-stack">
                <div className="sc-row">
                    <Popover
                        label="Graph settings"
                        trigger={props => (
                            <Button variant="outline" {...props}>
                                <Icon name="tune" />
                                Settings
                            </Button>
                        )}
                    >
                        {close => (
                            <div className="sc-popover-form">
                                <Field label="Label size">
                                    {props => <Input {...props} defaultValue="12 px" />}
                                </Field>
                                <Switch label="Show legend" defaultChecked />
                                <Button variant="primary" size="sm" onClick={close}>
                                    Apply
                                </Button>
                            </div>
                        )}
                    </Popover>
                    <DropdownMenu
                        trigger={props => (
                            <Button variant="outline" {...props}>
                                Actions
                                <Icon name="expand_more" />
                            </Button>
                        )}
                        items={[
                            { type: 'label', label: 'View' },
                            { label: 'Zoom to fit', icon: 'all_out', onSelect: () => {} },
                            {
                                label: 'Save view',
                                icon: 'bookmark_add',
                                shortcut: 'Ctrl+S',
                                onSelect: () => setToast(true),
                            },
                            {
                                label: 'Export SVG',
                                icon: 'download',
                                disabled: true,
                                onSelect: () => {},
                            },
                            { type: 'separator' },
                            {
                                label: 'Remove view',
                                icon: 'delete',
                                danger: true,
                                onSelect: () => setConfirm(true),
                            },
                        ]}
                    />
                    <Tooltip text="Opens the source file" side="top">
                        <Button variant="ghost">Hover me</Button>
                    </Tooltip>
                </div>
                <div className="sc-row">
                    <Button variant="secondary" onClick={() => setDialog(true)}>
                        Open dialog
                    </Button>
                    <Button variant="secondary" onClick={() => setConfirm(true)}>
                        Alert dialog
                    </Button>
                    <Button variant="secondary" onClick={() => setSheet(true)}>
                        Open sheet
                    </Button>
                    <Button variant="secondary" onClick={() => setToast(true)}>
                        Show toast
                    </Button>
                </div>
            </div>

            <Dialog
                open={dialog}
                onClose={() => setDialog(false)}
                title="Which folder is the app?"
                description="Only the files the app uses are analysed."
                footer={
                    <>
                        <Button onClick={() => setDialog(false)}>Cancel</Button>
                        <Button variant="primary" onClick={() => setDialog(false)}>
                            Analyze
                        </Button>
                    </>
                }
            >
                <Field label="App folder">
                    {props => <Input {...props} defaultValue="apps/web" />}
                </Field>
            </Dialog>

            <Dialog
                alert
                size="sm"
                open={confirm}
                onClose={() => setConfirm(false)}
                title="Remove this view?"
                description="The saved positions of its nodes are lost."
                footer={
                    <>
                        <Button autoFocus onClick={() => setConfirm(false)}>
                            Keep
                        </Button>
                        <Button variant="danger" onClick={() => setConfirm(false)}>
                            Remove
                        </Button>
                    </>
                }
            />

            <Sheet
                open={sheet}
                onClose={() => setSheet(false)}
                title="GraphView.tsx"
                description="src/features/graph"
                footer={<Button onClick={() => setSheet(false)}>Close</Button>}
            >
                <div className="sc-stack">
                    <Switch label="Highlight imports" defaultChecked />
                    <Switch label="Show functions" />
                    <p className="sc-mono">Cyclomatic complexity: 7</p>
                </div>
            </Sheet>

            <Toast
                open={toast}
                onClose={closeToast}
                variant="success"
                title="View saved"
                description="You find it under Saved views."
                action={{ label: 'Undo', onClick: () => {} }}
            />
        </Card>
    );
};
