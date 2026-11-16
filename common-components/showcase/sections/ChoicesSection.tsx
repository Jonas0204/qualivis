import {
    Card,
    Checkbox,
    Label,
    RadioGroup,
    Separator,
    Slider,
    Switch,
    Toggle,
    ToggleGroup,
} from '../../index';

/** Checkbox, RadioGroup, Switch, Slider, Toggle, ToggleGroup. */
export const ChoicesSection = () => (
    <Card title="Choices" description="Checkbox, RadioGroup, Switch, Slider, Toggle, ToggleGroup">
        <div className="sc-stack">
            <div className="sc-stack">
                <Checkbox label="Show node labels" defaultChecked />
                <Checkbox
                    label="Include test files"
                    description="Files named *.test.* and *.spec.*"
                />
                <Checkbox label="Some folders selected" indeterminate />
                <Checkbox label="Locked setting" disabled defaultChecked />
            </div>
            <Separator />
            <RadioGroup
                label="Graph view"
                orientation="horizontal"
                defaultValue="app"
                options={[
                    { value: 'app', label: 'App' },
                    { value: 'component', label: 'Component' },
                    { value: 'file', label: 'File', disabled: true },
                ]}
            />
            <Separator />
            <div className="sc-stack">
                <Switch label="Fade unrelated nodes" defaultChecked />
                <Switch label="Live layout" description="Moves nodes while you drag." />
            </div>
            <Separator />
            <div className="sc-stack">
                <Label htmlFor="sc-link-distance">Link distance</Label>
                <Slider id="sc-link-distance" defaultValue={60} />
                <Slider aria-label="Disabled slider" defaultValue={30} disabled />
            </div>
            <Separator />
            <div className="sc-row">
                <Toggle aria-label="Show cluster" defaultPressed>
                    Cluster
                </Toggle>
                <Toggle variant="outline">Legend</Toggle>
                <ToggleGroup
                    label="Node shape"
                    defaultValue={['circle']}
                    items={[
                        { value: 'circle', icon: 'circle', ariaLabel: 'Circle' },
                        { value: 'square', icon: 'square', ariaLabel: 'Square' },
                        { value: 'hexagon', icon: 'hexagon', ariaLabel: 'Hexagon' },
                    ]}
                />
                <ToggleGroup
                    label="Edges"
                    type="multiple"
                    defaultValue={['imports']}
                    items={[
                        { value: 'imports', label: 'Imports' },
                        { value: 'calls', label: 'Calls' },
                    ]}
                />
            </div>
        </div>
    </Card>
);
