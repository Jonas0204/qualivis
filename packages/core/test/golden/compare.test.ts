import { describe, expect, it } from 'vitest';
import { diffGolden, type Tolerated } from './compare';

describe('diffGolden', () => {
    it('finds no difference between equal objects, whatever the key order', () => {
        expect(
            diffGolden({ a: [1, { b: 'x' }], c: null }, { c: null, a: [1, { b: 'x' }] })
        ).toEqual([]);
    });

    it('tolerates and records a 0.5 % difference of a Halstead float', () => {
        const tolerated: Tolerated[] = [];
        const diffs = diffGolden(
            { halstead: { difficulty: 10.05 } },
            { halstead: { difficulty: 10 } },
            '$',
            tolerated
        );
        expect(diffs).toEqual([]);
        expect(tolerated).toEqual([{ path: '$.halstead.difficulty', expected: 10, actual: 10.05 }]);
    });

    it('reports a different integer metric', () => {
        expect(diffGolden({ cyclomatic: 17 }, { cyclomatic: 16 })).toEqual([
            '$.cyclomatic: expected 16, got 17',
        ]);
    });

    it('reports a different array element with its path', () => {
        const actual = { nodes: [{ id: 'a' }, { id: 'c' }] };
        const expected = { nodes: [{ id: 'a' }, { id: 'b' }] };
        expect(diffGolden(actual, expected)).toEqual(['$.nodes.1.id: expected "b", got "c"']);
    });

    it('does not tolerate float differences outside the Halstead paths', () => {
        expect(diffGolden({ sloc: { physical: 10.05 } }, { sloc: { physical: 10 } })).toHaveLength(
            1
        );
    });
});
