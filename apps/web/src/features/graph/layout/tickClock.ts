import type { LayoutSolver } from './types';

/** Ticks per second: two per frame at 120 frames per second, so the layout takes about 1.25 s. */
const ticksPerSecond = 240;

type RunOptions = {
    /** Read once after every tick. */
    now: () => number;
    /** When the run started, by `now`. */
    startedAt: number;
    /** The ticks stop after this time; the rest waits for the next run. */
    budgetMs: number;
    /** Gets the duration of every tick. */
    record: (ms: number) => void;
};

/**
 * The clock of the two drivers of a solver: the animation frames on the main thread
 * (forceLayout.ts) and the slices of the web worker (layoutHost.ts). d3's own timer runs one tick
 * per animation frame, so its layout takes twice as long on a 60 Hz display as on a 120 Hz one;
 * this clock keeps to `ticksPerSecond` on any display, and in the worker however long the page
 * takes to draw a frame.
 */
export const createTickClock = () => {
    let lastAt: number | undefined;
    /** Ticks the elapsed time asks for; the fraction carries over to the next run. */
    let due = 0;

    return {
        /** False before the first `advance` and after `reset`. */
        running: () => lastAt !== undefined,
        /** Adds the ticks due since the last call; the first call of a run gives one tick. */
        advance: (at: number) => {
            due = lastAt === undefined ? 1 : due + ((at - lastAt) * ticksPerSecond) / 1000;
            lastAt = at;
        },
        /** Runs the due ticks until the solver is at rest or the budget is used; their number. */
        run: (solver: LayoutSolver, { now, startedAt, budgetMs, record }: RunOptions): number => {
            let ticks = 0;
            let tickedAt = startedAt;
            while (due >= 1) {
                solver.tick();
                due--;
                ticks++;
                const endedAt = now();
                record(endedAt - tickedAt);
                tickedAt = endedAt;
                if (solver.atRest() || endedAt - startedAt > budgetMs) {
                    break;
                }
            }
            return ticks;
        },
        hasDue: () => due >= 1,
        /** Drops the ticks a run over budget left, instead of catching up with them. */
        dropBacklog: () => {
            due = Math.min(due, 1);
        },
        /** The next run starts with one tick in its first frame. */
        reset: () => {
            lastAt = undefined;
            due = 0;
        },
    };
};
