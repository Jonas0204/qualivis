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
export type { ClusterResult } from './rules/cluster';
export { computeClusters } from './rules/cluster';
export type { ClusterPaint } from './rules/color';
export { brightenColor, clusterColor, clusterPaint } from './rules/color';
export type { Connections, LinkEnds } from './rules/connectivity';
export { connectedNodes, isLinkHighlighted, withoutNodes } from './rules/connectivity';
export type { IconDescription, VisualIcon } from './rules/icons';
export { describeIconText, getNodeIcons } from './rules/icons';
export type { Point } from './rules/linkGeometry';
export { linkEnd } from './rules/linkGeometry';
export type { MetricLevel, MetricRow } from './rules/metricRows';
export { metricRows } from './rules/metricRows';
export type { NodeVisual, View, VisualOptions } from './rules/nodeVisuals';
export { computeNodeVisual } from './rules/nodeVisuals';
export type { PreviewCircle, PreviewDots } from './rules/previewGeometry';
export {
    indexAngle,
    mainRadius,
    outerRadius,
    previewCircles,
    previewDots,
    previewWidth,
} from './rules/previewGeometry';
export type { ReactConstraint } from './rules/reactConstraints';
export { reactConstraints } from './rules/reactConstraints';
export { resolveThreshold } from './rules/thresholds';
export type { ViewModel, VisualLink, VisualNode } from './rules/viewModel';
export { buildViewModel } from './rules/viewModel';
export type { WorkspaceChoice } from './workspace/analyzeWorkspace';
export { analyzeWorkspaceAsync } from './workspace/analyzeWorkspace';
export { findAppCandidates } from './workspace/appCandidates';
export type { WorkspacePackage } from './workspace/packages';
export { findPackages } from './workspace/packages';
export type { ProjectFiles } from './workspace/projectFiles';
export { findPythonFolders, isConfigFile, isExcludedFolder } from './workspace/projectFiles';
export type { ImportResolver } from './workspace/resolveImport';
export { createImportResolver } from './workspace/resolveImport';
export type { ImportReference } from './workspace/scanImports';
export { scanImports } from './workspace/scanImports';
export { isTestFile, selectAppFiles } from './workspace/selectFiles';
export type { PathMapping } from './workspace/tsconfig';
export { pathMappingFor } from './workspace/tsconfig';
