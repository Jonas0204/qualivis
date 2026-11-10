import type { SourceFile } from '../analysis/analyzeProject';
import { parse } from '../legacy/parser';

export type ImportReference = {
    specifier: string;
    /** Offsets of the string literal including its quotes. */
    start: number;
    end: number;
    typeOnly: boolean;
};

type Program = ReturnType<typeof parse>['program'];
type Statement = Program['body'][number];
type Specifier = { type: string; importKind?: string | null; exportKind?: string | null };

const isTypeKind = (kind: string | null | undefined) => kind === 'type';

/** `import type …`, `export type … from`, or a non-empty list of `type` specifiers only. */
const isTypeOnly = (kind: string | null | undefined, specifiers: readonly Specifier[]) =>
    isTypeKind(kind) ||
    (specifiers.length > 0 &&
        specifiers.every(({ importKind, exportKind }) => isTypeKind(importKind ?? exportKind)));

const toReference = (statement: Statement): ImportReference | undefined => {
    switch (statement.type) {
        case 'ImportDeclaration':
            return {
                specifier: statement.source.value,
                start: statement.source.start ?? 0,
                end: statement.source.end ?? 0,
                typeOnly: isTypeOnly(statement.importKind, statement.specifiers),
            };
        case 'ExportNamedDeclaration':
        case 'ExportAllDeclaration':
            return statement.source
                ? {
                      specifier: statement.source.value,
                      start: statement.source.start ?? 0,
                      end: statement.source.end ?? 0,
                      typeOnly: isTypeOnly(
                          statement.exportKind,
                          statement.type === 'ExportNamedDeclaration' ? statement.specifiers : []
                      ),
                  }
                : undefined;
        default:
            return undefined;
    }
};

/**
 * Import and re-export specifiers at the top level of a file, in source order. Only a parse with
 * the parser of the analysis, no traversal; dynamic `import()` and `require()` are not reported.
 * A parse error is logged with the path and gives an empty list (the analysis reports it later).
 */
export const scanImports = (file: SourceFile): ImportReference[] => {
    let program: Program;
    try {
        program = parse(file.code, file.path).program;
    } catch (error) {
        // biome-ignore lint/suspicious/noConsole: the parser error does not name the file
        console.error('Scanning imports failed:', file.path, error);
        return [];
    }
    return program.body.flatMap(statement => {
        const reference = toReference(statement);
        return reference ? [reference] : [];
    });
};
