import pathBrowserify from 'path-browserify';
import _ESComplexProject from 'typhonjs-escomplex-project/dist/ESComplexProject';
import type { EscomplexReport } from '../model/report';
import { cjsDefault } from './interop';

const ESComplexProject = cjsDefault(_ESComplexProject);

/**
 * Runs typhonjs-escomplex-project like the legacy browser bundle did: with a POSIX path module
 * (legacy: the `path` npm polyfill). Node's win32 `path` would change project-level metrics
 * (adjacencyList, visibilityList, coreSize, ...) and does not exist in the browser (ADR-005).
 */
export function analyzeModules(modules: Array<{ ast: unknown; srcPath: string }>): EscomplexReport {
  return new ESComplexProject(pathBrowserify).analyze(modules) as EscomplexReport;
}
