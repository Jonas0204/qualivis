import { type RefCallback, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { debounce } from '../../lib/debounce';
import type { Rect } from '../../lib/isColliding';
import { hiddenLabels, type LabelRect } from './labelCollision';

/** Measures a label text; jsdom has no layout, so tests pass fixed values. */
export type LabelMeasure = (label: SVGTSpanElement) => Rect;

export const browserLabelMeasure: LabelMeasure = label => label.getBoundingClientRect();

export type LabelCollisionOptions = {
    /** Setting hideOverlappingLabels. */
    enabled: boolean;
    /**
     * Layout run (useLayout): a restart shows all labels again, as the legacy restartGraph drew
     * new ones.
     */
    run: number;
    measure?: LabelMeasure;
};

export type LabelCollision = {
    /** Ids of the nodes whose label is hidden. */
    hidden: ReadonlySet<string>;
    /** Ref of the label text of a node; the same function for the same id. */
    labelRef: (nodeId: string) => RefCallback<SVGTSpanElement>;
    /**
     * Measures the labels 250 ms after the last call (legacy debouncedHideOverlappingLabels); the
     * graph calls it at every layout end and zoom change.
     */
    update: () => void;
};

/** Wait of the legacy debouncedHideOverlappingLabels (graph.component.ts:72). */
const wait = 250;

const noIds: ReadonlySet<string> = new Set();

type Measured = { run: number; ids: ReadonlySet<string> };

const sameIds = (a: ReadonlySet<string>, b: ReadonlySet<string>) =>
    a.size === b.size && [...a].every(id => b.has(id));

const byDocumentOrder = ([, a]: [string, Element], [, b]: [string, Element]) =>
    a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1;

/**
 * Overlapping labels (G18, §13): hides the earlier of two overlapping labels; the node then shows
 * its label as tooltip (GraphNode).
 */
export const useLabelCollision = ({
    enabled,
    run,
    measure = browserLabelMeasure,
}: LabelCollisionOptions): LabelCollision => {
    const [measured, setMeasured] = useState<Measured>();
    const labelsRef = useRef(new Map<string, SVGTSpanElement>());
    const refsRef = useRef(new Map<string, RefCallback<SVGTSpanElement>>());
    const optionsRef = useRef({ enabled, run, measure });

    useEffect(() => {
        optionsRef.current = { enabled, run, measure };
    }, [enabled, run, measure]);

    const update = useMemo(
        () =>
            debounce(() => {
                const current = optionsRef.current;
                if (!current.enabled) {
                    return;
                }
                const labels = [...labelsRef.current].sort(byDocumentOrder);
                // As in the legacy app, every label is shown before it is measured, so a label
                // hidden at the last zoom level can come back. Afterwards each label gets the
                // display React gave it, until React draws the new result.
                const displays = labels.map(([, label]) => label.style.display);
                for (const [, label] of labels) {
                    label.style.display = '';
                }
                const rects: LabelRect[] = labels.map(([id, label]) => ({
                    id,
                    rect: current.measure(label),
                }));
                labels.forEach(([, label], index) => {
                    label.style.display = displays[index] ?? '';
                });
                const ids = hiddenLabels(rects);
                // The same set when nothing changed, so that the memoized graph does not render
                // again after every zoom (P08-S09).
                setMeasured(previous =>
                    previous?.run === current.run && sameIds(previous.ids, ids)
                        ? previous
                        : { run: current.run, ids }
                );
            }, wait),
        []
    );

    useEffect(() => update.cancel, [update]);

    const labelRef = useCallback((nodeId: string) => {
        let ref = refsRef.current.get(nodeId);
        if (!ref) {
            ref = label => {
                if (!label) {
                    return;
                }
                labelsRef.current.set(nodeId, label);
                return () => {
                    if (labelsRef.current.get(nodeId) === label) {
                        labelsRef.current.delete(nodeId);
                    }
                };
            };
            refsRef.current.set(nodeId, ref);
        }
        return ref;
    }, []);

    const hidden = enabled && measured?.run === run ? measured.ids : noIds;
    return { hidden, labelRef, update };
};
