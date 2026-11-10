import posix from 'path-browserify';
import type { SourceFile } from '../analysis/analyzeProject';
import type { ImportResolver } from './resolveImport';
import { scanImports } from './scanImports';

/** The specifier the legacy core resolves to exactly this file: relative, with extension. */
const relativeSpecifier = (fromPath: string, target: string): string => {
    const path = posix.relative(posix.dirname(fromPath), target);
    return path.startsWith('.') ? path : `./${path}`;
};

/**
 * Replaces every resolvable, not type-only specifier by a relative path with extension, so the
 * legacy core finds the file exactly instead of by prefix (K12) and needs no /src/ lookup (K4).
 * Only the text between the quotes changes: same quotes, same lines. Others stay as written.
 */
export const rewriteImports = (file: SourceFile, resolve: ImportResolver): SourceFile => {
    let code = file.code;
    // Back to front, so the offsets of the earlier references stay valid.
    for (const { specifier, start, end, typeOnly } of scanImports(file).reverse()) {
        const target = typeOnly ? undefined : resolve(specifier, file.path);
        if (target !== undefined) {
            code = `${code.slice(0, start + 1)}${relativeSpecifier(file.path, target)}${code.slice(end - 1)}`;
        }
    }
    return { path: file.path, code };
};
