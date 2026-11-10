import type { SourceFile } from '../analysis/analyzeProject';
import { sortFiles } from '../analysis/sortFiles';
import type { ProjectFiles } from './projectFiles';
import { createImportResolver, type ImportResolver } from './resolveImport';
import { scanImports } from './scanImports';

const testFolder = /\/(__tests__|__mocks__)\//;
const testName = /\.(test|spec|stories)\.[^/]*$/;

/**
 * Tests, mocks and stories: a path in __tests__/ or __mocks__/, or a file name with .test., .spec.
 * or .stories. A test named like `PageTest.tsx` outside __tests__/ is not detected (O18), so a
 * component `Contest.tsx` never counts as a test.
 */
export const isTestFile = (path: string): boolean => testFolder.test(path) || testName.test(path);

/**
 * Source files of the app folder (without tests and .d.ts) and every source file they reach
 * through imports and re-exports that are not type-only, across packages; sorted like sortFiles.
 * Test files are never included.
 */
export const selectAppFiles = (
    project: ProjectFiles,
    appDir: string,
    resolve: ImportResolver = createImportResolver(project)
): SourceFile[] => {
    const byPath = new Map(project.sources.map(file => [file.path, file]));
    const prefix = `${appDir}/`;
    const queue = project.sources.filter(
        ({ path }) => path.startsWith(prefix) && !isTestFile(path) && !path.endsWith('.d.ts')
    );
    const selected = new Map(queue.map(file => [file.path, file]));
    for (let file = queue.shift(); file; file = queue.shift()) {
        for (const { specifier, typeOnly } of scanImports(file)) {
            const path = typeOnly ? undefined : resolve(specifier, file.path);
            const target = path === undefined ? undefined : byPath.get(path);
            if (target && !selected.has(target.path) && !isTestFile(target.path)) {
                selected.set(target.path, target);
                queue.push(target);
            }
        }
    }
    return sortFiles([...selected.values()]);
};
