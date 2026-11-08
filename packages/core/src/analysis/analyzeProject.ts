import { findReport } from '../legacy/findReport';
import { generateAppGraph } from '../legacy/generateAppGraph';
import { isComponentFile } from '../legacy/isComponentFile';
import { parse } from '../legacy/parser';
import { traverse } from '../legacy/traverse';
import type { AstWithPath, FileMap } from '../model/fileMap';
import type { Graph } from '../model/graph';
import type { EscomplexReport } from '../model/report';
import { analyzeModules } from './escomplex';
import { hasSingleComponent } from './hasSingleComponent';
import { sortFiles } from './sortFiles';

export type SourceFile = {
  /** Absolute project path starting with '/', e.g. '/my-app/src/App.js'. */
  path: string;
  code: string;
};

export type AnalysisResult = {
  fileMap: FileMap;
  /** Empty ({ nodes: [], links: [] }) for single-component projects (legacy). */
  appGraph: Graph;
  report: EscomplexReport;
};

export type AnalyzeAsyncOptions = {
  /** Called with the cumulated progress in percent (0..100), like the legacy progress bar. */
  onProgress?: (percent: number) => void;
};

const yieldToHost = () => new Promise<void>(resolve => setTimeout(resolve, 0));

/** Keeps files with components or a default export pointing to a file (data.service.ts:59-66). */
const filterFileMap = (fileMap: FileMap): FileMap =>
  Object.fromEntries(
    Object.entries(fileMap).filter(
      ([_, file]) =>
        (file.components && Object.keys(file.components).length > 0) ||
        // biome-ignore lint/complexity/useOptionalChain: kept verbatim from data.service.ts:63
        (file.defaultExport && file.defaultExport.startsWith('/'))
    )
  );

/** Attaches the escomplex report to every component graph node (data.service.ts:71-81). */
const attachReports = (fileMap: FileMap, report: EscomplexReport): void => {
  for (const [fileName, file] of Object.entries(fileMap)) {
    for (const [componentName, component] of Object.entries(file.components || {})) {
      if (!component.graph) continue;
      component.graph.nodes = component.graph.nodes.map(node => {
        node.report = findReport(report, fileMap, fileName, componentName, node.id);
        return node;
      });
    }
  }
};

/**
 * The legacy pipeline (data.service.ts:28-91) as one generator, shared by the sync and the async
 * entry point. It yields the progress increment after each parsed and each traversed file.
 */
const pipeline = function* (files: readonly SourceFile[]): Generator<number, AnalysisResult> {
  const componentFiles = sortFiles(files).filter(isComponentFile);
  const asts: AstWithPath[] = [];
  const fileMap: FileMap = {};
  const progressPercent = (1 / componentFiles.length) * 50;

  for (const file of componentFiles) {
    asts.push({ ast: parse(file.code, file.path), srcPath: file.path });
    fileMap[file.path] = { code: file.code };
    yield progressPercent;
  }

  const report = analyzeModules(asts);

  for (const file of componentFiles) {
    const { components, defaultExport } = traverse(asts, file.path, report);
    fileMap[file.path].components = components;
    fileMap[file.path].defaultExport = defaultExport;
    yield progressPercent;
  }

  const result = filterFileMap(fileMap);
  attachReports(result, report);
  const appGraph = hasSingleComponent(result)
    ? { nodes: [], links: [] }
    : generateAppGraph(result, componentFiles, report);
  return { fileMap: result, appGraph, report };
};

/**
 * Analyses a project like the legacy app: file map with component graphs, app graph and
 * escomplex report. Input order does not matter (ADR-006). Throws on syntax errors.
 */
export const analyzeProject = (files: readonly SourceFile[]): AnalysisResult => {
  const steps = pipeline(files);
  let step = steps.next();
  while (!step.done) step = steps.next();
  return step.value;
};

/**
 * Same result as `analyzeProject`, but yields to the host after every file and reports the
 * cumulated progress (2 calls per component file, the last one ≈ 100). Rejects on syntax errors.
 */
export const analyzeProjectAsync = async (
  files: readonly SourceFile[],
  options: AnalyzeAsyncOptions = {}
): Promise<AnalysisResult> => {
  const steps = pipeline(files);
  let progress = 0;
  let step = steps.next();
  while (!step.done) {
    await yieldToHost();
    progress += step.value;
    options.onProgress?.(progress);
    step = steps.next();
  }
  return step.value;
};
