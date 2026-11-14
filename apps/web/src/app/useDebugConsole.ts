import type { AnalysisResult } from '@qualivis/core';
import { useStore } from 'jotai';
import { useEffect } from 'react';
import { type PerfSnapshot, perfSnapshot, resetPerfStats } from '../lib/perfStats';
import { analysisAtom } from '../state/analysisAtoms';
import type { StateStore } from '../state/StateProvider';
import { viewGraphAtom } from '../state/viewAtoms';

/** Long tasks or long animation frames the browser reported. */
type LongWork = {
    count: number;
    totalMs: number;
    maxMs: number;
    /** Long animation frames only: their time in style, layout and paint; the rest is script. */
    styleAndLayoutMs?: number;
};

/**
 * What `qualivis.info()` returns: facts for performance and refactoring work. Only sizes, counts
 * and timings, no names or paths of the project, so it can be shared.
 */
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
        largestComponentGraphs: { nodes: number; links: number }[];
    };
    view: { view: string; nodes: number; links: number } | null;
    dom: { elements: number; graphNodes: number; graphLinks: number };
    perf: PerfSnapshot;
    longTasks: LongWork | 'unsupported';
    longAnimationFrames: LongWork | 'unsupported';
};

/** `export()` saves the facts as a JSON file. */
export type DebugInfoWithExport = DebugInfo & { export: () => void };

export type DebugConsole = {
    /** Facts about the analysis, the view, the DOM and the recorded timings. */
    info: () => DebugInfoWithExport;
    /** Clears the recorded timings, e.g. before measuring one action. */
    reset: () => void;
};

type WindowWithConsole = Window & { qualivis?: DebugConsole };

const round = (value: number) => Math.round(value * 100) / 100;

const graphSizes = (result: AnalysisResult | undefined) => {
    const components = Object.values(result?.fileMap ?? {}).flatMap(file =>
        Object.values(file.components ?? {}).map(component => ({
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

type LongAnimationFrame = PerformanceEntry & { styleAndLayoutStart?: number };

/** Time of a long animation frame from the start of style and layout to its end. */
const styleAndLayout = (entry: LongAnimationFrame) =>
    entry.styleAndLayoutStart ? entry.startTime + entry.duration - entry.styleAndLayoutStart : 0;

/** Watches one kind of long work; `undefined` when the browser does not report it. */
const watchLongWork = (type: string) => {
    const frames = type === 'long-animation-frame';
    if (
        typeof PerformanceObserver === 'undefined' ||
        !PerformanceObserver.supportedEntryTypes?.includes(type)
    ) {
        return undefined;
    }
    const none = (): LongWork => ({
        count: 0,
        totalMs: 0,
        maxMs: 0,
        ...(frames && { styleAndLayoutMs: 0 }),
    });
    let work = none();
    const observer = new PerformanceObserver(list => {
        for (const entry of list.getEntries()) {
            work = {
                count: work.count + 1,
                totalMs: work.totalMs + entry.duration,
                maxMs: Math.max(work.maxMs, entry.duration),
                ...(work.styleAndLayoutMs !== undefined && {
                    styleAndLayoutMs: work.styleAndLayoutMs + styleAndLayout(entry),
                }),
            };
        }
    });
    observer.observe({ type, buffered: true });
    return {
        read: (): LongWork => ({
            ...work,
            totalMs: round(work.totalMs),
            maxMs: round(work.maxMs),
            ...(work.styleAndLayoutMs !== undefined && {
                styleAndLayoutMs: round(work.styleAndLayoutMs),
            }),
        }),
        reset: () => {
            work = none();
        },
        disconnect: () => observer.disconnect(),
    };
};

/** Saves `info` as a JSON file in the downloads of the browser. */
const saveAsFile = (info: DebugInfo) => {
    const blob = new Blob(
        [
            `${JSON.stringify(info, null, 2)}
`,
        ],
        { type: 'application/json' }
    );
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `qualivis-info-${info.takenAt.replace(/[:.]/g, '-')}.json`;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url));
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
            const info: DebugInfo = {
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
            // Not enumerable: the console and JSON.stringify show the facts only.
            return Object.defineProperty(info, 'export', {
                value: () => saveAsFile(info),
            }) as DebugInfoWithExport;
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
 * Puts `qualivis.info()` and `qualivis.reset()` on `window`, for the browser console.
 * `qualivis.info().export()` saves the result as a JSON file; in Chrome, `copy(qualivis.info())`
 * copies it.
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
