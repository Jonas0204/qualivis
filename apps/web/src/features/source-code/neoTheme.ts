import { HighlightStyle, syntaxHighlighting } from '@codemirror/language';
import { EditorView } from '@codemirror/view';
import { tags } from '@lezer/highlight';

// The CodeMirror 5 theme "neo" of the legacy app (src/assets/neo.css, style reference §4), with the
// layout rules of codemirror.css that it relies on.

const comment = '#75787b';
const keyword = '#1d75b3';
const atom = '#75438a';
const tag = '#9c3328';
const string = '#b35e14';
const variable = '#047d65';

export const neoEditorTheme = EditorView.theme({
    '&': {
        height: '100%',
        backgroundColor: '#ffffff',
        color: '#2e383c',
    },
    // CodeMirror 5 drew no focus outline.
    '&.cm-focused': { outline: 'none' },
    '.cm-scroller': {
        // The generic family only, so that the browser takes its monospace size, as CodeMirror 5.
        fontFamily: 'monospace',
        lineHeight: '1.4375',
    },
    '.cm-content': { padding: '4px 0', caretColor: '#676767' },
    // neo: `pre { padding: 0 }`
    '.cm-line': { padding: '0' },
    '.cm-cursor, .cm-dropCursor': { borderLeftColor: '#676767' },
    '.cm-gutters': {
        backgroundColor: 'transparent',
        border: 'none',
        borderRight: '10px solid transparent',
    },
    '.cm-lineNumbers .cm-gutterElement': {
        padding: '0',
        minWidth: '20px',
        color: '#e0e2e5',
    },
});

export const neoHighlightStyle = HighlightStyle.define([
    { tag: [tags.comment, tags.lineComment, tags.blockComment], color: comment },
    {
        tag: [
            tags.keyword,
            tags.controlKeyword,
            tags.moduleKeyword,
            tags.operatorKeyword,
            tags.definitionKeyword,
            tags.self,
        ],
        color: keyword,
    },
    { tag: [tags.propertyName, tags.definition(tags.propertyName)], color: keyword },
    { tag: [tags.atom, tags.bool, tags.null], color: atom },
    { tag: tags.number, color: atom },
    { tag: [tags.tagName, tags.angleBracket], color: tag },
    { tag: tags.string, color: string },
    { tag: tags.variableName, color: variable },
    // CodeMirror 5 styled definitions as "def", which neo leaves in the text colour.
    { tag: tags.definition(tags.variableName), color: 'inherit' },
]);

export const neoTheme = [neoEditorTheme, syntaxHighlighting(neoHighlightStyle)];
