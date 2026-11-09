import { describe, expect, it } from 'vitest';
import { parse } from '../legacy/parser';
import { analyzeModules } from './escomplex';

const files = [
    {
        srcPath: '/p/src/a.js',
        code: "import x from './b';\nexport function f(a, b) { if (a) { return b; } return 0; }\n",
    },
    { srcPath: '/p/src/b.js', code: 'export default 1;\n' },
];

const analyze = () => {
    return analyzeModules(files.map(f => ({ ast: parse(f.code, f.srcPath), srcPath: f.srcPath })));
};

describe('analyzeModules', () => {
    it('reports every module under its unchanged path', () => {
        const report = analyze();
        expect(report.modules.map(m => m.srcPath)).toEqual(['/p/src/a.js', '/p/src/b.js']);
    });

    it('computes method metrics', () => {
        const f = analyze().modules[0]?.methods.find(m => m.name === 'f');
        expect(f).toMatchObject({ cyclomatic: 2, paramCount: 2 });
    });

    it('resolves relative imports with POSIX paths (project-level dependencies)', () => {
        // Sparse matrix: module 0 (a.js) depends on module 1 (b.js). Node's win32 path yields [].
        expect(analyze().adjacencyList).toEqual([{ row: 0, cols: [1] }]);
    });
});
