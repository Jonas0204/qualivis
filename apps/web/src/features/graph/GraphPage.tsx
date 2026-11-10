import { useAtomValue } from 'jotai';
import type { ReactNode } from 'react';
import { fullScreenAtom } from '../../state/viewAtoms';
import { SplitPane } from '../../ui/SplitPane';
import { CodeQualityPanel } from '../code-quality/CodeQualityPanel';
import { FileTree } from '../file-tree/FileTree';
import { SourceCodePanel } from '../source-code/SourceCodeView';
import styles from './GraphPage.module.css';
import { GraphView, type GraphViewProps } from './GraphView';

export type GraphPageProps = {
    /** Props for the graph; tests pass fake layouts and measurements. */
    graph?: GraphViewProps;
    /** Panels of the side columns; tests pass their own. */
    fileTree?: ReactNode;
    codeQuality?: ReactNode;
    sourceCode?: ReactNode;
};

/**
 * The graph page of the legacy graph view (graph-view.component.html): file tree | graph | code
 * quality above the source code, in pixel columns of 275 | rest | 575 and rows of 363 | rest. Full
 * screen (G13) hides the side columns; GraphView fits the graph in afterwards.
 */
export const GraphPage = ({
    graph,
    fileTree = <FileTree />,
    codeQuality = <CodeQualityPanel />,
    sourceCode = <SourceCodePanel />,
}: GraphPageProps) => {
    const fullScreen = useAtomValue(fullScreenAtom);

    return (
        <div className={styles.page}>
            <SplitPane
                direction="horizontal"
                areas={[
                    {
                        key: 'fileTree',
                        size: 275,
                        visible: !fullScreen,
                        label: 'file tree',
                        children: fileTree,
                    },
                    { key: 'graph', size: '*', children: <GraphView {...graph} /> },
                    {
                        key: 'side',
                        size: 575,
                        visible: !fullScreen,
                        label: 'side panels',
                        children: (
                            <SplitPane
                                direction="vertical"
                                areas={[
                                    {
                                        key: 'codeQuality',
                                        size: 363,
                                        label: 'code quality',
                                        children: codeQuality,
                                    },
                                    { key: 'sourceCode', size: '*', children: sourceCode },
                                ]}
                            />
                        ),
                    },
                ]}
            />
        </div>
    );
};
