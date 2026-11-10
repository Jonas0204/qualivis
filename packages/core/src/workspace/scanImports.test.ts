import { afterEach, describe, expect, it, vi } from 'vitest';
import { scanImports } from './scanImports';

const scan = (code: string, path = '/r/App.tsx') => scanImports({ path, code });

const specifiers = (code: string) =>
    scan(code).map(({ specifier, typeOnly }) => ({ specifier, typeOnly }));

afterEach(() => {
    vi.restoreAllMocks();
});

describe('scanImports', () => {
    it('reports default, named, namespace and side-effect imports in source order', () => {
        const code = [
            "import React from 'react';",
            "import { useState, useMemo as memo } from './hooks';",
            "import * as utils from '../utils';",
            "import './styles.css';",
        ].join('\n');
        expect(specifiers(code)).toEqual([
            { specifier: 'react', typeOnly: false },
            { specifier: './hooks', typeOnly: false },
            { specifier: '../utils', typeOnly: false },
            { specifier: './styles.css', typeOnly: false },
        ]);
    });

    it('marks type-only imports: import type, or only type specifiers', () => {
        const code = [
            "import type { Size } from './types';",
            "import { type A, type B } from './ab';",
            "import { type C, d } from './cd';",
            "import Def, { type E } from './def';",
        ].join('\n');
        expect(specifiers(code)).toEqual([
            { specifier: './types', typeOnly: true },
            { specifier: './ab', typeOnly: true },
            { specifier: './cd', typeOnly: false },
            { specifier: './def', typeOnly: false },
        ]);
    });

    it('reports re-exports, and type-only ones as such', () => {
        const code = [
            "export { x } from './x';",
            "export * from './all';",
            "export * as ns from './ns';",
            "export type { T } from './t';",
            "export { type U } from './u';",
            'export const local = 1;',
            'const y = 2;',
            'export { y };',
        ].join('\n');
        expect(specifiers(code)).toEqual([
            { specifier: './x', typeOnly: false },
            { specifier: './all', typeOnly: false },
            { specifier: './ns', typeOnly: false },
            { specifier: './t', typeOnly: true },
            { specifier: './u', typeOnly: true },
        ]);
    });

    it('does not report dynamic import() or require()', () => {
        const code = [
            "const Lazy = lazy(() => import('./Lazy'));",
            "const fs = require('fs');",
            'export function load() {',
            "    return import('./Other');",
            '}',
        ].join('\n');
        expect(scan(code)).toEqual([]);
    });

    it('gives the offsets of the string literal with its quotes', () => {
        const code = 'import { a } from \'./a\';\nexport * from "../b";';
        const references = scan(code);
        expect(references.map(({ start, end }) => code.slice(start, end))).toEqual([
            "'./a'",
            '"../b"',
        ]);
    });

    it('parses JavaScript files with the parser of the analysis', () => {
        expect(specifiers("import Button from './Button';\nexport default Button;")).toEqual([
            { specifier: './Button', typeOnly: false },
        ]);
        expect(scan("import Button from './Button';", '/r/index.js')).toHaveLength(1);
    });

    it('logs a parse error with the path and gives an empty list', () => {
        const error = vi.spyOn(console, 'error').mockImplementation(() => undefined);
        expect(scan("import { a from './a';", '/r/Broken.tsx')).toEqual([]);
        expect(error).toHaveBeenCalledWith(
            'Scanning imports failed:',
            '/r/Broken.tsx',
            expect.any(SyntaxError)
        );
    });
});
