import { describe, expect, it } from 'vitest';
import { createLayoutHost, type LayoutReply, type LayoutRequest } from './layoutHost';

type Start = Extract<LayoutRequest, { type: 'start' }>;

const chain = (count: number, overrides: Partial<Start> = {}): Start => ({
    type: 'start',
    nodes: Array.from({ length: count }, () => ({ width: 48, height: 48 })),
    links: Array.from({ length: count - 1 }, (_, index) => [index, index + 1]),
    width: 800,
    height: 600,
    atRest: false,
    ...overrides,
});

/** A host whose clock and deferred slices the test runs; every tick takes `tickMs`. */
const createHost = (tickMs = 1) => {
    const replies: LayoutReply[] = [];
    const deferred: { run: () => void; delayMs: number }[] = [];
    let time = 0;
    const handle = createLayoutHost({
        post: reply => replies.push(reply),
        defer: (run, delayMs) => deferred.push({ run, delayMs }),
        // The host reads the clock once at the start of a slice and once after every tick.
        now: () => {
            const current = time;
            time += tickMs;
            return current;
        },
    });
    /** Runs the next slice after its delay; false when none waits. */
    const runSlice = () => {
        const next = deferred.shift();
        if (!next) {
            return false;
        }
        time += next.delayMs;
        next.run();
        return true;
    };
    /** Runs slices, taking every tick message at once, until none waits. */
    const runToRest = () => {
        let slices = 0;
        while (runSlice()) {
            handle({ type: 'ack' });
            slices++;
        }
        return slices;
    };
    const ticks = () => replies.reduce((sum, reply) => sum + reply.tickMs.length, 0);
    return { handle, replies, deferred, runSlice, runToRest, ticks };
};

const xy = (reply: LayoutReply | undefined) => Array.from(reply?.positions ?? []);

describe('createLayoutHost', () => {
    it('ticks 300 times, sends positions on the way and the final ones with the end', () => {
        const { handle, replies, runToRest, ticks } = createHost();

        handle(chain(5));
        runToRest();

        expect(ticks()).toBe(300);
        expect(replies.filter(reply => reply.type === 'end')).toHaveLength(1);
        const last = replies.at(-1);
        expect(last?.type).toBe('end');
        expect(last?.positions).toHaveLength(10);
        expect(xy(last).every(Number.isFinite)).toBe(true);
        expect(xy(last)).not.toEqual(xy(replies[0]));
    });

    it('gives the same positions as the same run again', () => {
        const run = () => {
            const host = createHost();
            host.handle(chain(8));
            host.runToRest();
            return xy(host.replies.at(-1));
        };

        expect(run()).toEqual(run());
    });

    it('goes on ticking but sends no positions until the page has taken the last ones', () => {
        const { handle, replies, runSlice, ticks } = createHost();

        handle(chain(5));
        runSlice();
        expect(replies).toHaveLength(1);

        runSlice();
        runSlice();
        expect(replies).toHaveLength(1);

        handle({ type: 'ack' });
        runSlice();
        expect(replies).toHaveLength(2);
        // The ticks of the slices in between are in the second message.
        expect(ticks()).toBeGreaterThan(replies[0]?.tickMs.length ?? 0);
        expect(replies[1]?.tickMs.length).toBeGreaterThan(replies[0]?.tickMs.length ?? 0);
    });

    it('ticks by the clock: 240 times per second, and waits when it is ahead', () => {
        const { handle, deferred, runSlice, ticks } = createHost(0.5);

        handle(chain(5));
        // First slice: one tick, then the simulation is ahead of its clock and waits 4 ms.
        runSlice();
        expect(ticks()).toBe(1);
        expect(deferred[0]?.delayMs).toBe(4);

        // The wait and the tick took 5 ms: one tick is due again (240 per second).
        handle({ type: 'ack' });
        runSlice();
        expect(ticks()).toBe(2);
    });

    it('ends a slice of slow ticks after 8 ms and goes on at once, without dropping ticks', () => {
        const { handle, deferred, runSlice, ticks } = createHost(5);

        handle(chain(5));
        runSlice();
        handle({ type: 'ack' });
        // 10 ms have passed, so two ticks are due; they take 5 ms each.
        runSlice();
        expect(ticks()).toBe(3);
        expect(deferred[0]?.delayMs).toBe(0);
    });

    it('lets the links flow down and keeps the order of the React methods with the flow rules', () => {
        const { handle, replies, runToRest } = createHost();

        handle(
            chain(3, {
                links: [[0, 1]],
                flow: { constraints: [{ axis: 'x', left: 1, right: 2, gap: 100 }] },
            })
        );
        runToRest();

        const [, y0, x1, y1, x2] = xy(replies.at(-1));
        expect((y1 ?? 0) - (y0 ?? 0)).toBeGreaterThanOrEqual(100);
        expect((x2 ?? 0) - (x1 ?? 0)).toBeGreaterThanOrEqual(100);
    });

    it('halts with the end and the positions of that moment, once', () => {
        const { handle, replies, runSlice, deferred } = createHost();

        handle(chain(5));
        runSlice();
        handle({ type: 'halt' });

        expect(replies.at(-1)?.type).toBe('end');
        const count = replies.length;
        handle({ type: 'halt' });
        expect(replies).toHaveLength(count);
        // The slice that was still waiting ticks once more to notice, then nothing waits.
        while (runSlice()) {
            handle({ type: 'ack' });
        }
        expect(deferred).toHaveLength(0);
    });

    it('waits at rest with a restored view and runs when a node is dragged', () => {
        const { handle, replies, deferred, runSlice, runToRest } = createHost();
        const nodes = [
            { width: 48, height: 48, x: 10, y: 20 },
            { width: 48, height: 48, x: 300, y: 20 },
        ];

        handle(chain(2, { nodes, atRest: true }));
        expect(deferred).toHaveLength(0);
        expect(replies).toHaveLength(0);

        handle({ type: 'drag', node: 0, x: 50, y: 60 });
        runSlice();
        // The dragged node is pinned to the pointer.
        expect(xy(replies[0]).slice(0, 2)).toEqual([50, 60]);

        handle({ type: 'dragEnd', node: 0, release: true });
        runToRest();
        expect(replies.at(-1)?.type).toBe('end');
        expect(xy(replies.at(-1)).slice(0, 2)).not.toEqual([50, 60]);
    });

    it('keeps a node pinned that is not released after dragging', () => {
        const { handle, replies, runToRest } = createHost();

        handle(chain(3));
        handle({ type: 'drag', node: 1, x: 700, y: 700 });
        handle({ type: 'dragEnd', node: 1, release: false });
        runToRest();

        expect(xy(replies.at(-1)).slice(2, 4)).toEqual([700, 700]);
    });
});
