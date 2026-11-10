// Layout interface from docs/migration/00-grundlagen/03-architektur.md §6. Engines mutate x/y of
// the nodes they get and report ticks; React only reads the positions.

export type LayoutNode = {
    id: string;
    width: number;
    height: number;
    x?: number;
    y?: number;
    fx?: number | null;
    fy?: number | null;
    index?: number;
};

export type LayoutLink = { source: LayoutNode; target: LayoutNode; inherits?: boolean };

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
    dragStart(node: LayoutNode): void;
    drag(node: LayoutNode, position: { x: number; y: number }): void;
    dragEnd(node: LayoutNode, options: { pin: boolean }): void;
};
