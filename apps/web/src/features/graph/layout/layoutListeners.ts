import type { LayoutEngine } from './types';

/** The tick and end listeners of a layout engine (forceLayout.ts, workerLayout.ts). */
export const createLayoutListeners = () => {
    const listeners = { tick: new Set<() => void>(), end: new Set<() => void>() };
    const subscribe =
        (type: keyof typeof listeners): LayoutEngine['onTick'] =>
        listener => {
            listeners[type].add(listener);
            return () => listeners[type].delete(listener);
        };
    return {
        notify: (type: keyof typeof listeners) => {
            for (const listener of listeners[type]) {
                listener();
            }
        },
        onTick: subscribe('tick'),
        onEnd: subscribe('end'),
        clear: () => {
            listeners.tick.clear();
            listeners.end.clear();
        },
    };
};
