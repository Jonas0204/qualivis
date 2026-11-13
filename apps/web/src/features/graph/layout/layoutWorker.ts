// Entry of the layout web worker (workerLayout.ts starts it): layoutHost.ts does the work.
import { createLayoutHost, type LayoutReply, type LayoutRequest } from './layoutHost';

/** The part of the worker scope used here; the project is typed for the page, not for workers. */
type WorkerScope = {
    postMessage: (message: LayoutReply, transfer: Transferable[]) => void;
    onmessage: ((event: MessageEvent<LayoutRequest>) => void) | null;
};

const scope = globalThis as unknown as WorkerScope;

// A message to itself runs after the waiting messages of the page, without the 4 ms that nested
// timeouts wait at least.
const channel = new MessageChannel();
let deferred: (() => void) | undefined;
channel.port1.onmessage = () => {
    const run = deferred;
    deferred = undefined;
    run?.();
};

const handle = createLayoutHost({
    post: reply => scope.postMessage(reply, [reply.positions.buffer]),
    defer: (run, delayMs) => {
        if (delayMs > 0) {
            setTimeout(run, delayMs);
        } else {
            deferred = run;
            channel.port2.postMessage(undefined);
        }
    },
});

scope.onmessage = event => handle(event.data);
