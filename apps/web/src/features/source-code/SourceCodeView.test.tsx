import { act, render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { NodeSelection } from '../../state/selection';
import { selectionAtom } from '../../state/selectionAtoms';
import { renderWithState } from '../../test/renderWithState';
import { initial } from '../../test/TestProvider';
import {
    type CreateEditor,
    createCodeMirror,
    SourceCodePanel,
    SourceCodeView,
} from './SourceCodeView';

/** Fake editor that records what the view asks for. */
const createFakeEditor = () => {
    const calls: string[] = [];
    const createEditor: CreateEditor = parent => {
        calls.push(`create ${parent.tagName}`);
        return {
            show: (code, { lineStart, lineEnd }) =>
                calls.push(`show ${code} ${lineStart}-${lineEnd}`),
            select: ({ lineStart, lineEnd }) => calls.push(`select ${lineStart}-${lineEnd}`),
            destroy: () => calls.push('destroy'),
        };
    };
    return { calls, createEditor };
};

const selected = (id: string, code: string, lineStart: number, lineEnd: number): NodeSelection => ({
    id,
    type: 'innerFunction',
    report: undefined,
    code,
    lineStart,
    lineEnd,
});

describe('SourceCodeView', () => {
    it('shows a new file with its lines and only selects other lines of the same file', () => {
        const { calls, createEditor } = createFakeEditor();
        const { rerender, unmount } = render(
            <SourceCodeView code="a" lineStart={2} lineEnd={4} createEditor={createEditor} />
        );

        rerender(<SourceCodeView code="a" lineStart={5} lineEnd={6} createEditor={createEditor} />);
        rerender(<SourceCodeView code="b" lineStart={1} lineEnd={3} createEditor={createEditor} />);
        unmount();

        expect(calls).toEqual(['create DIV', 'show a 2-4', 'select 5-6', 'show b 1-3', 'destroy']);
    });

    it('shows the code again in a new editor', () => {
        const first = createFakeEditor();
        const second = createFakeEditor();
        const { rerender } = render(
            <SourceCodeView code="a" lineStart={2} lineEnd={4} createEditor={first.createEditor} />
        );

        rerender(
            <SourceCodeView code="a" lineStart={2} lineEnd={4} createEditor={second.createEditor} />
        );

        expect(second.calls).toEqual(['create DIV', 'show a 2-4']);
    });

    it('shows the code only for exactly one selected element (S1)', () => {
        const { calls, createEditor } = createFakeEditor();
        const one = selected('render', 'code', 59, 71);
        const { store } = renderWithState(<SourceCodePanel createEditor={createEditor} />, {
            initialValues: [initial(selectionAtom, [one])],
        });
        expect(calls).toEqual(['create DIV', 'show code 59-71']);

        act(() => store.set(selectionAtom, [one, selected('x', 'code', 1, 2)]));
        expect(calls.at(-1)).toBe('destroy');

        act(() => store.set(selectionAtom, null));
        act(() => store.set(selectionAtom, [selected('y', 'other', 3, 4)]));
        expect(calls.slice(-2)).toEqual(['create DIV', 'show other 3-4']);
    });

    it('runs with CodeMirror: read-only document with the lines selected', () => {
        const parent = document.createElement('div');
        document.body.append(parent);
        const editor = createCodeMirror(parent);

        editor.show('one\ntwo\nthree\nfour', { lineStart: 2, lineEnd: 3 });

        const content = parent.querySelector('.cm-content');
        expect(content?.textContent).toBe('onetwothreefour');
        expect(parent.querySelectorAll('.cm-lineNumbers .cm-gutterElement').length).toBeGreaterThan(
            0
        );
        // Read-only: CodeMirror marks the content as not editable for assistive technology.
        expect(content?.getAttribute('aria-readonly')).toBe('true');
        editor.destroy();
        parent.remove();
    });
});
