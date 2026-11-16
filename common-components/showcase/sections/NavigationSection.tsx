import { Accordion, Breadcrumb, Card, Tabs } from '../../index';

/** Tabs in both looks, Breadcrumb, Accordion. */
export const NavigationSection = () => (
    <Card title="Navigation" description="Tabs, Breadcrumb, Accordion">
        <div className="sc-stack">
            <Breadcrumb
                items={[
                    { label: 'Project', onClick: () => {} },
                    { label: 'src', onClick: () => {} },
                    { label: 'GraphView.tsx' },
                ]}
            />
            <Tabs
                label="Panels"
                items={[
                    {
                        id: 'quality',
                        label: 'Code quality',
                        content: 'Metrics of the selected node.',
                    },
                    { id: 'source', label: 'Source', content: 'The file with its highlights.' },
                    { id: 'tree', label: 'Files', content: 'All files of the project.' },
                ]}
            />
            <Tabs
                label="View"
                variant="segmented"
                items={[
                    { id: 'app', label: 'App', content: 'All components and their imports.' },
                    { id: 'component', label: 'Component', content: 'One component in detail.' },
                    { id: 'off', label: 'Off', content: '', disabled: true },
                ]}
            />
            <Accordion
                exclusive
                defaultOpen={['loc']}
                items={[
                    {
                        id: 'loc',
                        title: 'Lines of code',
                        content: 'Physical lines without blank lines and comments.',
                    },
                    {
                        id: 'cyclomatic',
                        title: 'Cyclomatic complexity',
                        content: 'Number of independent paths through a function.',
                    },
                    {
                        id: 'maintainability',
                        title: 'Maintainability',
                        content: 'Index from 0 to 171; higher is easier to maintain.',
                    },
                ]}
            />
        </div>
    </Card>
);
