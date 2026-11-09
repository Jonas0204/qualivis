import { type DependencyList, useEffect, useState } from 'react';
import type { LayoutEngine } from './layout/types';

export type LayoutState = {
    /** Grows with the ticks, at most once per animation frame, so React draws the new positions. */
    version: number;
    /** True once the current engine has come to rest. */
    ended: boolean;
};

/**
 * Runs the engine that `createEngine` builds and builds a new one when `deps` change. The engine
 * stops on cleanup, so React's StrictMode double effect never leaves two simulations running.
 */
export const useLayout = (
    createEngine: () => LayoutEngine | undefined,
    deps: DependencyList
): LayoutState => {
    const [state, setState] = useState<LayoutState>({ version: 0, ended: false });

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
            setState(current => ({ version: current.version + 1, ended: true }));
        });

        setState(current => (current.ended ? { ...current, ended: false } : current));
        engine.start();

        return () => {
            offTick();
            offEnd();
            engine.stop();
            if (frame !== undefined) {
                cancelAnimationFrame(frame);
            }
        };
    }, deps);

    return state;
};
