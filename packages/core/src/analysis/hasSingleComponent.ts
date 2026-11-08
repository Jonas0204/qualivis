import type { FileMap } from '../model/fileMap';

/**
 * True if the project has exactly one file with exactly one component; the app graph is then
 * skipped (legacy: data.service.ts:190-196, with the file map as a parameter).
 */
export const hasSingleComponent = (fileMap: FileMap): boolean | undefined =>
  Object.keys(fileMap).length === 1 &&
  Object.values(fileMap)[0].components &&
  // biome-ignore lint/style/noNonNullAssertion: checked one line above (kept verbatim from legacy)
  Object.keys(Object.values(fileMap)[0].components!).length === 1;
