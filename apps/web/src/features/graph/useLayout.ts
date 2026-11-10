import { type DependencyList, useCallback, useEffect, useRef, useState } from 'react';
import type { LayoutEngine } from './layout/types';

export type LayoutState = {
    /**
     * Grows when React has to draw the new positions: at most once per animation frame while the
     * engine ticks, unless `onFrame` moved the drawn graph itself, and at every end.
     */
    version: number;
    /** Counts the engines started: a new value means the layout restarted. */
    run: number;
    /** True once the current engine has come to rest. */
    ended: boolean;
    /** Counts the ends the engines reported, also those after dragging. */
    ends: number;
    /** True while the engine ticks: from its first tick (also after dragging) to its end. */
    running: boolean;
};

export type Layout = LayoutState & {
    /** The running engine (for dragging); undefined without one. */
    getEngine: () => LayoutEngine | undefined;
    /** Ends the running animation where the nodes are (LayoutEngine.halt). */
    halt: () => void;
};

/**
 * Moves the drawn graph to the new positions without React (writePositions); false when React has
 * to render them, e.g. before the graph is drawn.
 */
export type FrameHandler = () => boolean;

/**
 * Runs the engine that `createEngine` builds and builds a new one when `deps` change. The engine
 * stops on cleanup, so React's StrictMode double effect never leaves two simulations running.
 * After ticks it calls `onFrame` once per animation frame and renders only if that returns false.
 */
export const useLayout = (
    createEngine: () => LayoutEngine | undefined,
    deps: DependencyList,
    onFrame?: FrameHandler
): Layout => {
    const [state, setState] = useState<LayoutState>({
        version: 0,
        run: 0,
        ended: false,
        ends: 0,
        running: false,
    });
    const engineRef = useRef<LayoutEngine>(undefined);
    const onFrameRef = useRef(onFrame);

    useEffect(() => {
        onFrameRef.current = onFrame;
    }, [onFrame]);

    // The caller names the deps, as with useEffect itself.
    useEffect(() => {
        const engine = createEngine();
        if (!engine) {
            return;
        }

        let frame: number | undefined;
        let running = false;
        const offTick = engine.onTick(() => {
            if (!running) {
                running = true;
                setState(current => ({ ...current, running: true }));
            }
            frame ??= requestAnimationFrame(() => {
                frame = undefined;
                if (!onFrameRef.current?.()) {
                    setState(current => ({ ...current, version: current.version + 1 }));
                }
            });
        });
        const offEnd = engine.onEnd(() => {
            running = false;
            setState(current => ({
                ...current,
                version: current.version + 1,
                ended: true,
                ends: current.ends + 1,
                running: false,
            }));
        });

        setState(current => ({ ...current, run: current.run + 1, ended: false, running: false }));
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
    const halt = useCallback(() => engineRef.current?.halt(), []);

    return { ...state, getEngine, halt };
};
