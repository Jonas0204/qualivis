import { CodeQualityPanel } from '../code-quality/CodeQualityPanel';
import styles from './GraphPage.module.css';
import { GraphView } from './GraphView';

/**
 * The graph page: graph | code quality side by side. Each component sizes itself in the row; full
 * screen (G13) hides the panel, and GraphView fits the graph in afterwards.
 */
export const GraphPage = () => (
    <div className={styles.page}>
        <GraphView />
        <CodeQualityPanel />
    </div>
);
