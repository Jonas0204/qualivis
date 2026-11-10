import { useLayoutEffect, useRef, useState } from 'react';

// biome-ignore lint/suspicious/noExplicitAny: handlers of any signature
type Handler = (...args: any[]) => unknown;

/**
 * The same object on every render, whose handlers call the handlers of the latest render. Lets a
 * memoized child (React.memo) keep its props although the parent builds new handlers on every
 * render. The keys of the first render count; handlers are called after the commit only (events).
 */
export const useStableHandlers = <T extends Record<string, Handler | undefined>>(
    handlers: T
): T => {
    const latestRef = useRef(handlers);

    useLayoutEffect(() => {
        latestRef.current = handlers;
    });

    const [stable] = useState(
        () =>
            Object.fromEntries(
                Object.keys(handlers).map(key => [
                    key,
                    (...args: unknown[]) => latestRef.current[key]?.(...args),
                ])
            ) as T
    );
    return stable;
};
