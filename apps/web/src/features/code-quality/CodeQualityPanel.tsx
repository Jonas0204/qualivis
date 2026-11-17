import { useAtomValue } from 'jotai';
import { selectionAtom } from '../../state/selectionAtoms';
import { fullScreenAtom } from '../../state/viewAtoms';
import styles from './CodeQualityPanel.module.css';
import { IconDescription } from './IconDescription';
import { MetricList } from './MetricList';

/**
 * The side column with the metrics and hints of the selected node. Full screen (G13) hides it and
 * keeps it mounted.
 */
export const CodeQualityPanel = () => {
    const fullScreen = useAtomValue(fullScreenAtom);
    const selectedNode = useAtomValue(selectionAtom)?.[0];
    const report = selectedNode?.report?.aggregate ?? selectedNode?.report;

    return (
        <aside className={styles.panel} aria-label="Code quality" hidden={fullScreen}>
            <h2 className={styles.header}>
                Code Quality
                {/* Like the legacy template, the name only with a report. */}
                {report && selectedNode && (
                    <span className={styles.name}>
                        {' '}
                        {selectedNode.label || selectedNode.id}
                        {selectedNode.report?.aggregate ? ' (aggregate)' : ''}
                    </span>
                )}
            </h2>
            {selectedNode && <MetricList />}
            {selectedNode?.icons?.length ? (
                <ul className={styles.hints} aria-label="Hints">
                    {selectedNode.icons.map((icon, index) => (
                        <li
                            // Two icons of a node can have the same kind and text.
                            key={`${index} ${icon.icon} ${icon.description.text}`}
                            data-class={icon.class}
                        >
                            <IconDescription icon={icon} />
                        </li>
                    ))}
                </ul>
            ) : null}
        </aside>
    );
};
