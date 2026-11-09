import type { SourceFile } from './analyzeProject';

/** Canonical input order (ADR-006): plain code-unit comparison, like Array.prototype.sort(). */
export const sortFiles = (files: readonly SourceFile[]): SourceFile[] =>
    [...files].sort((a, b) => (a.path < b.path ? -1 : a.path > b.path ? 1 : 0));
