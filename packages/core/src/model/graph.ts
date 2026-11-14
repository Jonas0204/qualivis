// Copied from legacy/angular/src/app/interfaces.ts (fields unchanged, `interface` → `type`).
import type { NodeKind, NodeType } from './types';

/** Same shape as d3-force's SimulationNodeDatum (kept local to stay dependency-free). */
type SimulationNodeDatum = {
    index?: number;
    x?: number;
    y?: number;
    vx?: number;
    vy?: number;
    fx?: number | null;
    fy?: number | null;
};

export type Node = SimulationNodeDatum & {
    id: string;
    label?: string;
    width?: number;
    height?: number;
    lineStart?: number;
    lineEnd?: number;
    functions?: Node[];
    icons?: NodeIcon[];
    type?: NodeType;
    kind?: NodeKind;
    special?: boolean;
    returnsJSX?: boolean;
    isUsingThis?: boolean;
    componentId?: string;
    // biome-ignore lint/suspicious/noExplicitAny: legacy field type kept 1:1; typed in P08-S01
    report?: any;
    extends?: boolean;
    warn?: boolean;
    error?: boolean;
    cluster?: number;
};

type NodeIcon = {
    icon: string; // Material icon name
    class: 'warn' | 'error';
    description: string;
    width?: number;
};

export type Link = {
    source: string;
    target: string;
    value?: number;
    id?: string;
    inherits?: boolean;
};

export type Graph = {
    nodes: Node[];
    links: Link[];
};
