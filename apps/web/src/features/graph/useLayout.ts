import { type DependencyList, useCallback, useEffect, useRef, useState } from 'react';
import type { LayoutEngine } from './layout/types';

export type LayoutState = {
    /** Grows with the ticks, at most once per animation frame, so React draws the new positions. */
    version: number;
    /** Counts the engines started: a new value means the layout restarted. */
    run: number;
    /** True once the current engine has come to rest. */
    ended: boolean;
    /** Counts the ends the engines reported, also those after dragging. */
    ends: number;
};

export type Layout = LayoutState & {
    /** The running engine (for dragging); undefined without one. */
    getEngine: () => LayoutEngine | undefined;
};

/**
 * Runs the engine that `createEngine` builds and builds a new one when `deps` change. The engine
 * stops on cleanup, so React's StrictMode double effect never leaves two simulations running.
 */
export const useLayout = (
    createEngine: () => LayoutEngine | undefined,
    deps: DependencyList
): Layout => {
    const [state, setState] = useState<LayoutState>({
        version: 0,
        run: 0,
        ended: false,
        ends: 0,
    });
    const engineRef = useRef<LayoutEngine>(undefined);

    // The caller names the deps, as with useEffect itself.
    useEffect(() => {
        const engine = createEngine();
        if (!engine) {
            return;
        }

        let frame: number | undefined;
        const offTick = engine.onTick(() => {
            frame ??= requestAnimationFrame(() => {
                frame = undefined;
                setState(current => ({ ...current, version: current.version + 1 }));
            });
        });
        const offEnd = engine.onEnd(() => {
            setState(current => ({
                ...current,
                version: current.version + 1,
                ended: true,
                ends: current.ends + 1,
            }));
        });

        setState(current => ({ ...current, run: current.run + 1, ended: false }));
        engineRef.current = engine;
        engine.start();

        return () => {
            offTick();
            offEnd();
            engine.stop();
            engineRef.current = undefined;
            if (frame !== undefined) {
                cancelAnimationFrame(frame);
            }
        };
    }, deps);

    const getEngine = useCallback(() => engineRef.current, []);

    return { ...state, getEngine };
};
