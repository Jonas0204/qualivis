import { javascript } from '@codemirror/lang-javascript';
import { search, searchKeymap } from '@codemirror/search';
import { EditorSelection, EditorState } from '@codemirror/state';
import { drawSelection, EditorView, keymap, lineNumbers } from '@codemirror/view';
import { useAtomValue } from 'jotai';
import { useEffect, useLayoutEffect, useRef } from 'react';
import { selectionAtom } from '../../state/selectionAtoms';
import { neoTheme } from './neoTheme';
import styles from './SourceCodeView.module.css';
import { selectionRange } from './selectionRange';

export type SourceLines = { lineStart?: number; lineEnd?: number };

/** The editor behind the view; tests pass a fake one, since jsdom cannot measure the text. */
export type SourceEditor = {
    /** Shows a new file and selects the lines. */
    show(code: string, lines: SourceLines): void;
    /** Selects other lines of the same file and scrolls to them. */
    select(lines: SourceLines): void;
    destroy(): void;
};

export type CreateEditor = (parent: HTMLElement) => SourceEditor;

const extensions = [
    lineNumbers(),
    // Draws the selection also while the editor has no focus, as CodeMirror 5 did.
    drawSelection(),
    // CodeMirror 5 used its JSX mode for every file, TypeScript too.
    javascript({ jsx: true, typescript: true }),
    EditorState.readOnly.of(true),
    // Ctrl+F (Cmd+F) for the search and Alt+G for "jump to line" (S4).
    search({ top: true }),
    keymap.of(searchKeymap),
    neoTheme,
];

/** A read-only CodeMirror 6 editor with line numbers, JSX highlighting and search. */
export const createCodeMirror: CreateEditor = parent => {
    const view = new EditorView({ parent, state: EditorState.create({ extensions }) });

    const select = ({ lineStart, lineEnd }: SourceLines) => {
        const range = selectionRange(view.state.doc, lineStart, lineEnd);
        if (!range) {
            return;
        }
        view.dispatch({
            selection: EditorSelection.single(range.anchor, range.head),
            effects: EditorView.scrollIntoView(range.scrollTo, { y: 'start' }),
        });
    };

    return {
        show: (code, lines) => {
            // A new state, so that the search and the history start fresh for the file.
            view.setState(EditorState.create({ doc: code, extensions }));
            select(lines);
        },
        select,
        destroy: () => view.destroy(),
    };
};

type SourceCodeViewProps = SourceLines & {
    code: string;
    createEditor?: CreateEditor;
};

/**
 * The file of the selected element, read-only, with its lines selected and scrolled to (legacy
 * source-code component, S2-S4). A new file selects the lines after loading; other lines of the
 * same file only select and scroll.
 */
export const SourceCodeView = ({
    code,
    lineStart,
    lineEnd,
    createEditor = createCodeMirror,
}: SourceCodeViewProps) => {
    const parentRef = useRef<HTMLDivElement>(null);
    const editorRef = useRef<SourceEditor>(undefined);
    const shownCodeRef = useRef<string>(undefined);

    useLayoutEffect(() => {
        const parent = parentRef.current;
        if (!parent) {
            return;
        }
        const editor = createEditor(parent);
        editorRef.current = editor;
        return () => {
            editor.destroy();
            editorRef.current = undefined;
            shownCodeRef.current = undefined;
        };
    }, [createEditor]);

    useEffect(() => {
        const editor = editorRef.current;
        if (!editor) {
            return;
        }
        if (shownCodeRef.current !== code) {
            shownCodeRef.current = code;
            editor.show(code, { lineStart, lineEnd });
        } else {
            editor.select({ lineStart, lineEnd });
        }
    }, [code, lineStart, lineEnd]);

    return <div ref={parentRef} className={styles.editor} />;
};

type SourceCodePanelProps = { createEditor?: CreateEditor };

/** The source code of the bottom right area: only for exactly one selected element (S1). */
export const SourceCodePanel = ({ createEditor }: SourceCodePanelProps) => {
    const selection = useAtomValue(selectionAtom);
    const selected = selection?.length === 1 ? selection[0] : undefined;
    if (!selected) {
        return null;
    }
    return (
        <SourceCodeView
            code={selected.code ?? ''}
            lineStart={selected.lineStart}
            lineEnd={selected.lineEnd}
            createEditor={createEditor}
        />
    );
};
