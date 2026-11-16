import type { MetricRow } from '@qualivis/core';
import { Accordion } from '../../../../../common-components';
import { MetricExplanation } from './MetricExplanation';
import { MetricSummary } from './MetricSummary';

/** The metrics of a report; a click on one opens its explanation (ADR-011 A23). */
export const MetricList = ({ rows }: { rows: readonly MetricRow[] }) =>
    rows.length === 0 ? null : (
        <Accordion
            items={rows.map(row => ({
                id: row.id,
                title: <MetricSummary row={row} />,
                content: <MetricExplanation row={row} />,
            }))}
        />
    );
