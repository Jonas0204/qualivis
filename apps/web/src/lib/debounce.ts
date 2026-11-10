export type Debounced = (() => void) & {
    /** Drops a pending call. */
    cancel: () => void;
};

/**
 * Calls `fn` once `wait` ms have passed without another call (legacy helper/debounce.ts, without
 * the unused `immediate`).
 */
export const debounce = (fn: () => void, wait: number): Debounced => {
    let timeout: ReturnType<typeof setTimeout> | undefined;
    const cancel = () => {
        clearTimeout(timeout);
        timeout = undefined;
    };
    const debounced = () => {
        cancel();
        timeout = setTimeout(() => {
            timeout = undefined;
            fn();
        }, wait);
    };
    return Object.assign(debounced, { cancel });
};
