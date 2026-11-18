// Public API of @qualivis/core: only what the web app and the CLI need. Knip reports an export
// here that nothing uses (includeEntryExports in knip.json).
export type { AnalysisResult, AnalyzeAsyncOptions, SourceFile } from './analysis/analyzeProject';
export { analyzeProject, analyzeProjectAsync } from './analysis/analyzeProject';
export { hasSingleComponent } from './analysis/hasSingleComponent';
export { findReport } from './legacy/findReport';
export { isComponentFile } from './legacy/isComponentFile';
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
export { clusterPaint } from './rules/color';
export type { LinkEnds } from './rules/connectivity';
export { connectedNodes, isLinkHighlighted, withoutNodes } from './rules/connectivity';
export type { VisualIcon } from './rules/icons';
export { describeIconText } from './rules/icons';
export { linkEnd } from './rules/linkGeometry';
export type { MetricRow } from './rules/metricRows';
export { metricRows } from './rules/metricRows';
export type { View } from './rules/nodeVisuals';
export {
    mainRadius,
    previewCircles,
    previewClassName,
    previewDots,
} from './rules/previewGeometry';
export type { ReactConstraint } from './rules/reactConstraints';
export { reactConstraints } from './rules/reactConstraints';
export type { ViewModel, VisualLink, VisualNode } from './rules/viewModel';
export { buildViewModel } from './rules/viewModel';
export { analyzeWorkspaceAsync } from './workspace/analyzeWorkspace';
export { findAppCandidates } from './workspace/appCandidates';
export type { WorkspacePackage } from './workspace/packages';
export type { ProjectFiles } from './workspace/projectFiles';
export { findPythonFolders, isConfigFile, isExcludedFolder } from './workspace/projectFiles';
