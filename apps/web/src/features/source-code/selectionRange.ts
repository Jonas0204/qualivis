/** The part of a CodeMirror document (`Text`) that the range needs. */
export type LineDoc = {
    readonly lines: number;
    readonly length: number;
    line(n: number): { readonly from: number };
};

export type SelectionRange = {
    /** Fixed end of the selection: start of the line after `lineEnd`. */
    anchor: number;
    /** Moving end of the selection: start of `lineStart`. */
    head: number;
    /** Position to scroll to the top: start of the line above `lineStart`. */
    scrollTo: number;
};

const lineStartAt = (doc: LineDoc, line: number) =>
    line > doc.lines ? doc.length : doc.line(Math.max(1, line)).from;

/**
 * Selection and scroll target of the legacy source code view (source-code.component.ts:61-87):
 * `setSelection({line: lineEnd, ch: 0}, {line: lineStart - 1, ch: 0})` in CodeMirror 5, 0-based,
 * and scrolling so that the line above the start is at the top. Lines are 1-based here; without
 * lines (a node outside the files) there is nothing to select.
 */
export const selectionRange = (
    doc: LineDoc,
    lineStart: number | undefined,
    lineEnd: number | undefined
): SelectionRange | undefined => {
    if (lineStart === undefined || lineEnd === undefined) {
        return undefined;
    }
    return {
        anchor: lineStartAt(doc, lineEnd + 1),
        head: lineStartAt(doc, lineStart),
        scrollTo: lineStartAt(doc, lineStart - 1),
    };
};
