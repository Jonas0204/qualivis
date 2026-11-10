import { useAtom, useAtomValue, useStore } from 'jotai';
import { useEffect, useLayoutEffect, useRef } from 'react';
import { findComponent } from '../features/graph/selectViewGraph';
import { analysisAtom } from '../state/analysisAtoms';
import { componentIdAtom } from '../state/viewAtoms';

/** The search parameter that holds the component of the component view (N5). */
export const componentParam = 'id';

/** The component id in the URL of the window, or undefined. */
export const componentIdFromUrl = (): string | undefined =>
    new URLSearchParams(window.location.search).get(componentParam) ?? undefined;

/** The URL of the window with `?id=` set to the component id, or without it. */
const urlWith = (componentId: string | undefined) => {
    const url = new URL(window.location.href);
    if (componentId === undefined) {
        url.searchParams.delete(componentParam);
    } else {
        // URLSearchParams encodes '#' as %23, so it does not become the fragment.
        url.searchParams.set(componentParam, componentId);
    }
    return url;
};

/**
 * Keeps the component view and the URL in step, as the legacy router did with `?id=`
 * (graph.component.ts:98-135, N5, N9, N13; ADR-011 A1): the URL at the start opens its component
 * view, opening or leaving a component view adds a history entry, and the browser's back and
 * forward buttons go between the views. An id the analysis does not know shows the app view and
 * leaves the URL (N9). The path stays; only `?id=` changes.
 */
export const useUrlState = () => {
    const [componentId, setComponentId] = useAtom(componentIdAtom);
    const store = useStore();
    const fileMap = useAtomValue(analysisAtom).result?.fileMap;
    // Removing an unknown id replaces the history entry instead of adding one.
    const replaceNextRef = useRef(false);
    // The id read from the URL until the atom has it; until then the atom must not change the URL.
    const fromUrlRef = useRef<{ id: string | undefined }>(undefined);

    // URL → atom: at the start (before the first paint) and on back and forward.
    useLayoutEffect(() => {
        const takeUrl = () => {
            const id = componentIdFromUrl();
            // A popstate that keeps the id (a change of the fragment only) renders nothing, so the
            // mark would stay and stop the next view change from reaching the URL.
            if (id === store.get(componentIdAtom)) {
                return;
            }
            fromUrlRef.current = { id };
            setComponentId(id);
        };
        takeUrl();
        const handlePopState = takeUrl;
        window.addEventListener('popstate', handlePopState);
        return () => window.removeEventListener('popstate', handlePopState);
    }, [store, setComponentId]);

    // An id of a component the analysis does not have (or one without a graph) goes.
    useEffect(() => {
        if (fileMap && componentId !== undefined && !findComponent(fileMap, componentId)?.graph) {
            replaceNextRef.current = true;
            setComponentId(undefined);
        }
    }, [fileMap, componentId, setComponentId]);

    // Atom → URL.
    useEffect(() => {
        const fromUrl = fromUrlRef.current;
        if (fromUrl) {
            if (fromUrl.id !== componentId) {
                return;
            }
            fromUrlRef.current = undefined;
        }
        // An id without a graph goes at once (effect above); it must not reach the URL, or it would
        // take the place of the entry of the view before.
        if (fileMap && componentId !== undefined && !findComponent(fileMap, componentId)?.graph) {
            return;
        }
        const replace = replaceNextRef.current;
        replaceNextRef.current = false;
        if (componentIdFromUrl() === componentId) {
            return;
        }
        const url = urlWith(componentId);
        if (replace) {
            window.history.replaceState(window.history.state, '', url);
        } else {
            window.history.pushState(null, '', url);
        }
    }, [fileMap, componentId]);
};
