import { describe, expect, it } from 'vitest';
import type { Node } from '../model/graph';
import type { MetricReport } from '../model/report';
import { describeIconText, getNodeIcons } from './icons';

/** A report far below every threshold; `sloc.logical` is not 0. */
const report = (
    values: { physical?: number; logical?: number; cyclomatic?: number } = {}
): MetricReport => ({
    cyclomatic: values.cyclomatic ?? 1,
    paramCount: 0,
    maxJsxNesting: 1,
    sloc: { physical: values.physical ?? 10, logical: values.logical ?? 5, jsx: 2 },
    halstead: { difficulty: 1, bugs: 0.01 },
});

const fn = (extra: Partial<Node> = {}): Node => ({
    id: 'handleClick',
    type: 'innerFunction',
    kind: 'FunctionComponent',
    ...extra,
});

const component = (extra: Partial<Node> = {}): Node => ({
    id: 'App',
    type: 'component',
    kind: 'FunctionComponent',
    ...extra,
});

const iconNames = (node: Node, r: MetricReport, view: 'app' | 'component' = 'component') =>
    getNodeIcons(node, r, view).map(icon => `${icon.icon}/${icon.class}`);

describe('getNodeIcons', () => {
    it('gives no icons for a node below every threshold', () => {
        expect(getNodeIcons(fn(), report(), 'component')).toEqual([]);
    });

    it('warns at 80 % of a threshold (cyclomatic 7 of 8)', () => {
        expect(getNodeIcons(fn(), report({ cyclomatic: 7 }), 'component')).toEqual([
            {
                icon: 'warning',
                class: 'warn',
                description: {
                    text: 'This function almost exceeds at least one metric threshold. A solution might be to split it into smaller functions.',
                },
            },
        ]);
    });

    it('reports an error for a function at its threshold', () => {
        const [icon] = getNodeIcons(fn(), report({ cyclomatic: 8 }), 'component');
        expect(icon).toEqual({
            icon: 'warning',
            class: 'error',
            description: {
                text: 'This function exceeds at least one metric threshold. A solution might be to split it into smaller functions.',
            },
        });
    });

    it('uses the component texts for components', () => {
        const [warn] = getNodeIcons(component(), report({ physical: 160 }), 'app');
        expect(warn?.description.text).toBe(
            'This component almost exceeds at least one metric threshold. A solution might be to split it into smaller components.'
        );
        const [error] = getNodeIcons(component(), report({ physical: 200 }), 'app');
        expect(error?.description.text).toBe(
            'This component exceeds at least one metric threshold. A solution might be to split it into smaller components.'
        );
    });

    it('shows only the error when an error comes before a warning', () => {
        // sloc.physical 250 ≥ 200 (error), cyclomatic 25 ≥ 24 = 0.8 × 30 (warning, checked later)
        expect(iconNames(component(), report({ physical: 250, cyclomatic: 25 }))).toEqual([
            'warning/error',
        ]);
    });

    it('shows only the error when a warning comes before an error', () => {
        // sloc.physical 170 (warning), cyclomatic 30 (error, checked later)
        expect(iconNames(component(), report({ physical: 170, cyclomatic: 30 }))).toEqual([
            'warning/error',
        ]);
    });

    it('marks empty functions, and then not as helper functions', () => {
        const classFunction = fn({ kind: 'ClassComponent', isUsingThis: false, returnsJSX: false });
        expect(getNodeIcons(classFunction, report({ logical: 0 }), 'component')).toEqual([
            {
                icon: 'delete',
                class: 'warn',
                description: { text: 'Empty functions should be removed' },
            },
        ]);
    });

    it('suggests a helper for a class function without this and without JSX', () => {
        const classFunction = fn({ kind: 'ClassComponent', isUsingThis: false, returnsJSX: false });
        expect(getNodeIcons(classFunction, report(), 'component')).toEqual([
            {
                icon: 'content_cut',
                class: 'warn',
                description: {
                    text: 'This function has no this reference and should be extracted into a helper function.',
                },
            },
        ]);
    });

    it('suggests no helper when the function uses this or is not a class function', () => {
        expect(iconNames(fn({ kind: 'ClassComponent', isUsingThis: true }), report())).toEqual([]);
        expect(iconNames(fn({ kind: 'FunctionComponent', isUsingThis: false }), report())).toEqual(
            []
        );
        expect(iconNames(component({ kind: 'ClassComponent' }), report())).toEqual([]);
    });

    it('suggests a component instead of a helper for a class function returning JSX', () => {
        const jsxFunction = fn({ kind: 'ClassComponent', isUsingThis: false, returnsJSX: true });
        const texts = getNodeIcons(jsxFunction, report(), 'component').map(i => i.description.text);
        expect(texts).toEqual([
            'Functions returning JSX should be components (except for the render function in class components)',
        ]);
    });

    it('suggests a component for functions returning JSX, except render', () => {
        expect(getNodeIcons(fn({ returnsJSX: true }), report(), 'component')).toEqual([
            {
                icon: 'content_cut',
                class: 'warn',
                description: {
                    text: 'Functions returning JSX should be components (except for the render function in class components)',
                },
            },
        ]);
        expect(iconNames(fn({ id: 'render', returnsJSX: true }), report())).toEqual([]);
    });

    it('recommends composition over inheritance', () => {
        expect(getNodeIcons(component({ extends: true }), report(), 'app')).toEqual([
            {
                icon: 'device_hub',
                class: 'warn',
                description: {
                    text: 'Component composition is recommended over inheritance.',
                    link: { href: 'https://reactjs.org/docs/composition-vs-inheritance.html' },
                },
            },
        ]);
    });

    it('marks deprecated lifecycle methods only in the component view', () => {
        const method = fn({ id: 'componentWillMount', kind: 'ClassComponent', isUsingThis: true });
        expect(getNodeIcons(method, report(), 'component')).toEqual([
            {
                icon: 'report',
                class: 'warn',
                description: {
                    text: 'Deprecated React lifecycle method',
                    link: {
                        href: 'https://reactjs.org/docs/react-component.html#legacy-lifecycle-methods',
                    },
                },
            },
        ]);
        expect(getNodeIcons(method, report(), 'app')).toEqual([]);
    });

    it('keeps the legacy order of several icons', () => {
        const node = fn({
            id: 'componentWillMount',
            kind: 'ClassComponent',
            returnsJSX: true,
            extends: true,
        });
        expect(iconNames(node, report({ logical: 0, cyclomatic: 9 }))).toEqual([
            'warning/error',
            'delete/warn',
            'content_cut/warn',
            'device_hub/warn',
            'report/warn',
        ]);
    });
});

describe('describeIconText', () => {
    it('appends the link like the legacy HTML text', () => {
        const [inheritance] = getNodeIcons(component({ extends: true }), report(), 'app');
        const [deprecated] = getNodeIcons(
            fn({ id: 'componentWillMount', kind: 'ClassComponent', isUsingThis: true }),
            report(),
            'component'
        );
        expect(inheritance && describeIconText(inheritance.description)).toBe(
            'Component composition is recommended over inheritance. (see https://reactjs.org/docs/composition-vs-inheritance.html)'
        );
        expect(deprecated && describeIconText(deprecated.description)).toBe(
            'Deprecated React lifecycle method (see https://reactjs.org/docs/react-component.html#legacy-lifecycle-methods)'
        );
    });

    it('returns texts without a link unchanged', () => {
        expect(describeIconText({ text: 'Empty functions should be removed' })).toBe(
            'Empty functions should be removed'
        );
    });
});
