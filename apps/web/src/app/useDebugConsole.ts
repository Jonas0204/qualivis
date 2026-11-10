import type { AnalysisResult } from '@qualivis/core';
import { useStore } from 'jotai';
import { useEffect } from 'react';
import { type PerfSnapshot, perfSnapshot, resetPerfStats } from '../lib/perfStats';
import { analysisAtom } from '../state/analysisAtoms';
import type { StateStore } from '../state/StateProvider';
import { componentIdAtom, viewGraphAtom } from '../state/viewAtoms';

/** Long tasks or long animation frames the browser reported. */
type LongWork = { count: number; totalMs: number; maxMs: number };

/** What `qualivis.info()` returns: facts for performance and refactoring work. */
export type DebugInfo = {
    takenAt: string;
    mode: string;
    browser: {
        userAgent: string;
        viewport: { width: number; height: number };
        devicePixelRatio: number;
        cores: number | undefined;
        /** Chrome only. */
        usedHeapMb: number | undefined;
    };
    analysis: {
        status: string;
        files: number;
        components: number;
        appGraph: { nodes: number; links: number };
        /** The five component graphs with the most nodes. */
        largestComponentGraphs: { id: string; nodes: number; links: number }[];
    };
    view: { view: string; componentId: string | undefined; nodes: number; links: number } | null;
    dom: { elements: number; graphNodes: number; graphLinks: number };
    perf: PerfSnapshot;
    longTasks: LongWork | 'unsupported';
    longAnimationFrames: LongWork | 'unsupported';
};

export type DebugConsole = {
    /** Facts about the analysis, the view, the DOM and the recorded timings. */
    info: () => DebugInfo;
    /** Clears the recorded timings, e.g. before measuring one action. */
    reset: () => void;
};

type WindowWithConsole = Window & { qualivis?: DebugConsole };

const round = (value: number) => Math.round(value * 100) / 100;

const graphSizes = (result: AnalysisResult | undefined) => {
    const components = Object.entries(result?.fileMap ?? {}).flatMap(([fileName, file]) =>
        Object.entries(file.components ?? {}).map(([name, component]) => ({
            id: `${fileName}#${name}`,
            nodes: component.graph?.nodes.length ?? 0,
            links: component.graph?.links.length ?? 0,
        }))
    );
    return {
        files: Object.keys(result?.fileMap ?? {}).length,
        components: components.length,
        appGraph: {
            nodes: result?.appGraph.nodes.length ?? 0,
            links: result?.appGraph.links.length ?? 0,
        },
        largestComponentGraphs: components.sort((a, b) => b.nodes - a.nodes).slice(0, 5),
    };
};

/** Watches one kind of long work; `undefined` when the browser does not report it. */
const watchLongWork = (type: string) => {
    if (
        typeof PerformanceObserver === 'undefined' ||
        !PerformanceObserver.supportedEntryTypes?.includes(type)
    ) {
        return undefined;
    }
    let work: LongWork = { count: 0, totalMs: 0, maxMs: 0 };
    const observer = new PerformanceObserver(list => {
        for (const entry of list.getEntries()) {
            work = {
                count: work.count + 1,
                totalMs: work.totalMs + entry.duration,
                maxMs: Math.max(work.maxMs, entry.duration),
            };
        }
    });
    observer.observe({ type, buffered: true });
    return {
        read: (): LongWork => ({ ...work, totalMs: round(work.totalMs), maxMs: round(work.maxMs) }),
        reset: () => {
            work = { count: 0, totalMs: 0, maxMs: 0 };
        },
        disconnect: () => observer.disconnect(),
    };
};

/** Builds the console helper for `store`; `dispose` stops watching long work. */
export const createDebugConsole = (store: StateStore): DebugConsole & { dispose: () => void } => {
    const longTasks = watchLongWork('longtask');
    const longFrames = watchLongWork('long-animation-frame');
    const heap = (performance as Performance & { memory?: { usedJSHeapSize: number } }).memory;

    return {
        info: () => {
            const analysis = store.get(analysisAtom);
            const viewGraph = store.get(viewGraphAtom);
            const graph = document.querySelector('.qv-graph');
            return {
                takenAt: new Date().toISOString(),
                mode: import.meta.env.MODE,
                browser: {
                    userAgent: navigator.userAgent,
                    viewport: { width: window.innerWidth, height: window.innerHeight },
                    devicePixelRatio: window.devicePixelRatio,
                    cores: navigator.hardwareConcurrency,
                    usedHeapMb: heap && round(heap.usedJSHeapSize / 2 ** 20),
                },
                analysis: { status: analysis.status, ...graphSizes(analysis.result) },
                view: viewGraph
                    ? {
                          view: viewGraph.view,
                          componentId: store.get(componentIdAtom),
                          nodes: viewGraph.graph.nodes.length,
                          links: viewGraph.graph.links.length,
                      }
                    : null,
                dom: {
                    elements: document.getElementsByTagName('*').length,
                    graphNodes: graph?.querySelectorAll('g.node').length ?? 0,
                    graphLinks: graph?.querySelectorAll('g.links > line').length ?? 0,
                },
                perf: perfSnapshot(),
                longTasks: longTasks?.read() ?? 'unsupported',
                longAnimationFrames: longFrames?.read() ?? 'unsupported',
            };
        },
        reset: () => {
            resetPerfStats();
            longTasks?.reset();
            longFrames?.reset();
        },
        dispose: () => {
            longTasks?.disconnect();
            longFrames?.disconnect();
        },
    };
};

/**
 * Puts `qualivis.info()` and `qualivis.reset()` on `window`, for the browser console. In Chrome,
 * `copy(qualivis.info())` copies the result as JSON.
 */
export const useDebugConsole = (): void => {
    const store = useStore();
    useEffect(() => {
        const target = window as WindowWithConsole;
        const { dispose, ...debugConsole } = createDebugConsole(store);
        target.qualivis = debugConsole;
        return () => {
            dispose();
            if (target.qualivis === debugConsole) {
                delete target.qualivis;
            }
        };
    }, [store]);
};
