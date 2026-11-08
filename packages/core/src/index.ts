// Public API of @qualivis/core: only what the web app and the CLI need.
export type { AnalysisResult, AnalyzeAsyncOptions, SourceFile } from './analysis/analyzeProject';
export { analyzeProject, analyzeProjectAsync } from './analysis/analyzeProject';
export { hasSingleComponent } from './analysis/hasSingleComponent';
export { extractFileTree } from './legacy/extractFileTree';
export { findReport } from './legacy/findReport';
export { isComponentFile } from './legacy/isComponentFile';
export { nestedStringAccess } from './legacy/nestedStringAccess';
export * from './model/clusterColors';
export type * from './model/fileMap';
export * from './model/files';
export type * from './model/graph';
export * from './model/graphSettings';
export * from './model/qualityMetrics';
export type * from './model/report';
export * from './model/settings';
export * from './model/specialMethods';
export type * from './model/types';
