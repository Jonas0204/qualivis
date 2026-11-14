import { recordDuration } from '../../../lib/perfStats';
import { createForceSolver, type ForceSolverOptions, freedAfterDrag } from './forceSolver';
import { createTickClock } from './tickClock';
import type { LayoutEngine, LayoutRestore } from './types';

export type ForceLayoutOptions = ForceSolverOptions & {
    /** Positions of an earlier layout of the graph to go on from (ADR-011 A22). */
    restore?: LayoutRestore;
};

/** Frames per second at most: a faster display moves the nodes in only some of its frames. */
const maxFramesPerSecond = 120;
const frameIntervalMs = 1000 / maxFramesPerSecond;
/** A frame this much early still counts: the times of the frames vary a little. */
const frameToleranceMs = 1;
/** The ticks of one frame stop after this time; a large graph then settles slower but smoothly. */
const frameBudgetMs = 6;

/**
 * The layout engine on the main thread: the force solver (forceSolver.ts), ticked in the animation
 * frames by the clock of tickClock.ts, at most `maxFramesPerSecond` frames.
 */
export const createForceLayout = (options: ForceLayoutOptions): LayoutEngine => {
    const solver = createForceSolver(options);
    const clock = createTickClock();
    const listeners = { tick: new Set<() => void>(), end: new Set<() => void>() };
    const notify = (type: keyof typeof listeners) => {
        for (const listener of listeners[type]) {
            listener();
        }
    };
    let frame: number | undefined;
    let nextFrameAt = 0;
    let stopped = false;

    const step = (now: number) => {
        frame = undefined;
        if (clock.running() && now < nextFrameAt - frameToleranceMs) {
            scheduleStep();
            return;
        }
        nextFrameAt = clock.running()
            ? Math.max(nextFrameAt + frameIntervalMs, now)
            : now + frameIntervalMs;
        clock.advance(now);
        const ticks = clock.run(solver, {
            now: () => performance.now(),
            startedAt: performance.now(),
            budgetMs: frameBudgetMs,
            record: ms => recordDuration('layout.tick', ms),
        });
        if (ticks > 0) {
            notify('tick');
        }
        if (ticks > 0 && solver.atRest()) {
            clock.reset();
            notify('end');
        } else {
            clock.dropBacklog();
            scheduleStep();
        }
    };
    const scheduleStep = () => {
        if (!stopped) {
            frame ??= requestAnimationFrame(step);
        }
    };
    const cancelStep = () => {
        if (frame !== undefined) {
            cancelAnimationFrame(frame);
            frame = undefined;
        }
        clock.reset();
    };

    return {
        start: () => {
            // A layout restored at rest ends at once, as after a normal end, so that dragging
            // wakes it up the same way (ADR-011 A22).
            if (options.restore && !options.restore.running) {
                solver.freeze();
                notify('end');
                return;
            }
            scheduleStep();
        },
        // For good: dragging does not start it again.
        stop: () => {
            stopped = true;
            cancelStep();
            listeners.tick.clear();
            listeners.end.clear();
        },
        // Without a further tick, which would still move the nodes by their velocity.
        halt: () => {
            if (solver.atRest()) {
                return;
            }
            cancelStep();
            solver.freeze();
            notify('end');
        },
        onTick: listener => {
            listeners.tick.add(listener);
            return () => listeners.tick.delete(listener);
        },
        onEnd: listener => {
            listeners.end.add(listener);
            return () => listeners.end.delete(listener);
        },
        drag: (node, { x, y }) => {
            solver.hold(node, x, y);
            scheduleStep();
        },
        dragEnd: (node, { pin }) => {
            solver.release(node, freedAfterDrag(pin, options.flow));
        },
    };
};
