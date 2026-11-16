import { Badge, Button, Card, DropdownMenu, Icon, Table } from '../../index';

const rows = [
    { file: 'GraphView.tsx', loc: 412, complexity: 18, level: 'danger' },
    { file: 'FileTree.tsx', loc: 236, complexity: 9, level: 'warning' },
    { file: 'Toolbar.tsx', loc: 21, complexity: 1, level: 'success' },
    { file: 'useLayout.ts', loc: 154, complexity: 6, level: 'success' },
] as const;

const levelText = { danger: 'Error', warning: 'Warn', success: 'OK' };

/** Table inside a Card with actions. */
export const DataSection = () => (
    <Card
        className="sc-wide"
        title="Data"
        description="Table, Card with actions"
        actions={
            <DropdownMenu
                align="end"
                trigger={props => (
                    <Button size="icon-sm" aria-label="Table actions" {...props}>
                        <Icon name="more_vert" />
                    </Button>
                )}
                items={[
                    { label: 'Sort by complexity', icon: 'sort', onSelect: () => {} },
                    { label: 'Copy as CSV', icon: 'content_copy', onSelect: () => {} },
                ]}
            />
        }
    >
        <Table caption="Largest files of the fixture project.">
            <thead>
                <tr>
                    <th>File</th>
                    <th data-align="end">Lines</th>
                    <th data-align="end">Complexity</th>
                    <th>Level</th>
                </tr>
            </thead>
            <tbody>
                {rows.map(row => (
                    <tr key={row.file}>
                        <td className="sc-mono">{row.file}</td>
                        <td data-align="end">{row.loc}</td>
                        <td data-align="end">{row.complexity}</td>
                        <td>
                            <Badge variant={row.level}>{levelText[row.level]}</Badge>
                        </td>
                    </tr>
                ))}
            </tbody>
        </Table>
    </Card>
);
