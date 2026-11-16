import { useAtomValue } from 'jotai';
import type { ReactNode } from 'react';
import { fullScreenAtom } from '../../state/viewAtoms';
import { CodeQualityPanel } from '../code-quality/CodeQualityPanel';
import styles from './GraphPage.module.css';
import { GraphView, type GraphViewProps } from './GraphView';

export type GraphPageProps = {
    /** Props for the graph; tests pass fake layouts and measurements. */
    graph?: GraphViewProps;
    /** Panel of the side column; tests pass their own. */
    codeQuality?: ReactNode;
};

/**
 * The graph page: graph | code quality in a column of 575 px, the width of the legacy right
 * column. Full screen (G13) hides the side column and keeps its panel mounted; GraphView fits the
 * graph in afterwards.
 */
export const GraphPage = ({ graph, codeQuality = <CodeQualityPanel /> }: GraphPageProps) => {
    const fullScreen = useAtomValue(fullScreenAtom);

    return (
        <div className={styles.page}>
            <div className={styles.graph}>
                <GraphView {...graph} />
            </div>
            <aside className={styles.side} aria-label="Code quality" hidden={fullScreen}>
                {codeQuality}
            </aside>
        </div>
    );
};
