import { isColliding, type Rect } from '../../lib/isColliding';

/** Where the label of a node is drawn. */
export type LabelRect = { id: string; rect: Rect };

/**
 * Ids of the labels to hide (§13, legacy hideOverlappingLabels, graph.component.ts:952-982): every
 * label is compared with all labels before it in document order, and of two overlapping labels the
 * earlier one is hidden.
 */
export const hiddenLabels = (labels: readonly LabelRect[]): Set<string> => {
    const hidden = new Set<string>();
    labels.forEach(({ rect }, i) => {
        for (const earlier of labels.slice(0, i)) {
            if (isColliding(rect, earlier.rect)) {
                hidden.add(earlier.id);
            }
        }
    });
    return hidden;
};
