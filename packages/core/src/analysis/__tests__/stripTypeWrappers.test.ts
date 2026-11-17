import { describe, expect, it } from 'vitest';
import { analyzeProject } from '../analyzeProject';

describe('type-only expressions', () => {
    it('analyses a for loop whose variable starts with an as expression', () => {
        const code = [
            'export const sum = (heads: number[], next: number[]): number => {',
            '    let total = 0;',
            '    for (let j = heads[0] as number; j >= 0; j = next[j] as number) {',
            '        total += j;',
            '    }',
            '    return total;',
            '};',
        ].join('\n');
        const result = analyzeProject([{ path: '/app/src/sum.ts', code }]);
        expect(result.report).toBeDefined();
    });
});
