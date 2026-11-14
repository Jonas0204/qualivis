// Layout interface from docs/migration/00-grundlagen/03-architektur.md §6. Engines mutate x/y of
// the nodes they get and report ticks; React only reads the positions.

export type LayoutNode = {
    id: string;
    width: number;
    height: number;
    x?: number;
    y?: number;
    vx?: number;
    vy?: number;
    fx?: number | null;
    fy?: number | null;
    index?: number;
};

export type LayoutLink = { source: LayoutNode; target: LayoutNode; inherits?: boolean };

/**
 * The nodes already have the positions of an earlier layout of the same graph (ADR-011 A22): the
 * engine keeps them and skips the initial layout. `running` goes on animating from there,
 * otherwise the layout reports its end at once and waits, e.g. for dragging.
 */
export type LayoutRestore = { running: boolean };

/**
 * One layout method, without timers and without the DOM: the main thread (forceLayout.ts) and the
 * web worker (layoutHost.ts) drive it by the same clock (tickClock.ts). It moves the nodes it was
 * made with.
 */
export type LayoutSolver = {
    /** One step of the layout. */
    tick(): void;
    /** Further ticks would hardly move the nodes. */
    atRest(): boolean;
    /** Holds a node at a position while it is dragged; the first hold wakes the layout up. */
    hold(node: LayoutNode, x: number, y: number): void;
    /** Ends dragging; `free` lets the node move again, otherwise it stays pinned. */
    release(node: LayoutNode, free: boolean): void;
    /** Comes to rest at once, without a further tick; holding wakes it up again. */
    freeze(): void;
};

export type LayoutEngine = {
    /** Starts the animation. */
    start(): void;
    /** Stops the animation and releases the listeners. */
    stop(): void;
    /**
     * Ends the running animation as if the layout had come to rest: the nodes stay where they are
     * and the end listeners run. Dragging starts it again, as after a normal end. Does nothing
     * when the layout is at rest.
     */
    halt(): void;
    /** Returns a function that removes the listener. */
    onTick(listener: () => void): () => void;
    onEnd(listener: () => void): () => void;
    drag(node: LayoutNode, position: { x: number; y: number }): void;
    dragEnd(node: LayoutNode, options: { pin: boolean }): void;
};
