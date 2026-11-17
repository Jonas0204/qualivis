import { metricRows } from '@qualivis/core';
import { useAtomValue } from 'jotai/react';
import { useMemo } from 'react';
import { Accordion } from '../../../../../common-components';
import { selectionAtom } from '../../state/selectionAtoms';
import { MetricExplanation } from './MetricExplanation';
import { MetricSummary } from './MetricSummary';

/** The metrics of a report; a click on one opens its explanation (ADR-011 A23). */
export const MetricList = () => {
    const selectedNode = useAtomValue(selectionAtom)?.[0];
    const rows = useMemo(() => (selectedNode ? metricRows(selectedNode) : []), [selectedNode]);
    return rows.length === 0 ? null : (
        <Accordion
            items={rows.map(row => ({
                id: row.id,
                title: <MetricSummary row={row} />,
                content: <MetricExplanation row={row} />,
            }))}
        />
    );
};
