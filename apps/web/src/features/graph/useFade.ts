import { connectedNodes, isLinkHighlighted, type LinkEnds, type Settings } from '@qualivis/core';
import { useCallback, useMemo, useRef, useState } from 'react';

/** The settings of the fading: "fade" and "highlight indirect nodes" (both on by default). */
export type FadeSettings = Pick<Settings, 'fade' | 'highlightIndirectNodes'>;

/** What stays visible while the graph is faded to a node (§12); the rest fades to 10 %. */
export type GraphFade<L extends LinkEnds = LinkEnds> = {
    /** The node itself and every node connected to it. */
    opaqueNodes: ReadonlySet<string>;
    /** Nodes reached only indirectly; they get a light fill. */
    indirectNodes: ReadonlySet<string>;
    opaqueLinks: ReadonlySet<L>;
};

export type Fade<L extends LinkEnds> = {
    /** Undefined while everything is shown. */
    faded: GraphFade<L> | undefined;
    /** Fades the graph to the node (legacy fade(d, 0.1)). */
    fadeTo: (nodeId: string) => void;
    /** Shows everything again (legacy fadeIn). */
    fadeIn: () => void;
    /** For useNodeDrag: no fading while a node is dragged (legacy `dragging`). */
    onDraggingChange: (dragging: boolean) => void;
};

const fadeGraph = <L extends LinkEnds>(
    focus: string,
    links: readonly L[],
    indirect: boolean
): GraphFade<L> => {
    const connections = connectedNodes(focus, links, { indirect });
    const outgoingAndIndirect = new Set([...connections.outgoing, ...connections.indirect]);
    return {
        opaqueNodes: new Set([
            focus,
            ...connections.incoming,
            ...connections.outgoing,
            ...connections.indirect,
        ]),
        indirectNodes: new Set(connections.indirect),
        opaqueLinks: new Set(
            links.filter(link => isLinkHighlighted(link, focus, outgoingAndIndirect))
        ),
    };
};

/**
 * Fading of the legacy createFading (graph.component.ts:711-809). The focus belongs to one layout
 * `run`: a restart drew all nodes anew at full opacity in the legacy app, so it shows everything
 * again here too. Without the setting "fade" nothing fades.
 */
export const useFade = <L extends LinkEnds>(
    links: readonly L[],
    run: number,
    settings: FadeSettings
): Fade<L> => {
    const enabled = settings.fade ?? true;
    const indirect = settings.highlightIndirectNodes ?? true;
    const [focus, setFocus] = useState<{ nodeId: string; run: number }>();
    const draggingRef = useRef(false);

    const nodeId = enabled && focus?.run === run ? focus.nodeId : undefined;
    const faded = useMemo(
        () => (nodeId === undefined ? undefined : fadeGraph(nodeId, links, indirect)),
        [nodeId, links, indirect]
    );

    const fadeTo = useCallback(
        (id: string) => {
            if (enabled && !draggingRef.current) {
                setFocus({ nodeId: id, run });
            }
        },
        [enabled, run]
    );
    const fadeIn = useCallback(() => {
        if (!draggingRef.current) {
            setFocus(undefined);
        }
    }, []);
    const onDraggingChange = useCallback((dragging: boolean) => {
        draggingRef.current = dragging;
    }, []);

    return { faded, fadeTo, fadeIn, onDraggingChange };
};
