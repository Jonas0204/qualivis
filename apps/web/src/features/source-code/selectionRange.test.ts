import { Text } from '@codemirror/state';
import { describe, expect, it } from 'vitest';
import { selectionRange } from './selectionRange';

// Ten lines "line 1" … "line 10"; line n starts at (n - 1) * 7 (6 characters and the line break).
const doc = Text.of(Array.from({ length: 10 }, (_, i) => `line ${i + 1}`));
const startOf = (line: number) => doc.line(line).from;

describe('selectionRange', () => {
    it('selects from the start of lineStart to the start of the line after lineEnd', () => {
        expect(selectionRange(doc, 3, 5)).toEqual({
            anchor: startOf(6),
            head: startOf(3),
            // The line above the start comes to the top.
            scrollTo: startOf(2),
        });
        expect(startOf(6)).toBe(35);
    });

    it('ends at the end of the document when lineEnd is the last line', () => {
        expect(selectionRange(doc, 8, 10)).toMatchObject({ anchor: doc.length, head: startOf(8) });
    });

    it('scrolls to the first line when the selection starts there', () => {
        expect(selectionRange(doc, 1, 1)).toEqual({ anchor: startOf(2), head: 0, scrollTo: 0 });
    });

    it('selects one line from its start to the start of the next one', () => {
        const range = selectionRange(doc, 4, 4);
        expect(doc.sliceString(range?.head ?? 0, range?.anchor)).toBe('line 4\n');
    });

    it('has nothing to select without lines', () => {
        expect(selectionRange(doc, undefined, undefined)).toBeUndefined();
    });
});
