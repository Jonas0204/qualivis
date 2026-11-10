import {
    type AnalysisResult,
    type AnalyzeAsyncOptions,
    analyzeProjectAsync,
} from '../analysis/analyzeProject';
import type { ProjectFiles } from './projectFiles';
import { createImportResolver } from './resolveImport';
import { rewriteImports } from './rewriteImports';
import { selectAppFiles } from './selectFiles';

/** The app folder of a monorepo to analyse, e.g. '/repo/apps/web'. */
export type WorkspaceChoice = { appDir: string };

/**
 * Analyses one app of a monorepo (ADR-019): the files the app reaches (selectAppFiles), with
 * every resolvable import rewritten to a relative path with extension, through the unchanged
 * legacy core. The file map then gets the original code back; the lines are the same, so the
 * source ranges still fit. onProgress covers the analysis only.
 */
export const analyzeWorkspaceAsync = async (
    project: ProjectFiles,
    choice: WorkspaceChoice,
    options: AnalyzeAsyncOptions = {}
): Promise<AnalysisResult> => {
    const resolve = createImportResolver(project);
    const files = selectAppFiles(project, choice.appDir, resolve);
    const result = await analyzeProjectAsync(
        files.map(file => rewriteImports(file, resolve)),
        options
    );
    for (const file of files) {
        const entry = result.fileMap[file.path];
        if (entry) {
            entry.code = file.code;
        }
    }
    return result;
};
