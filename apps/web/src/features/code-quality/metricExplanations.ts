/**
 * What a metric of the code quality panel measures and how the analysis computes it (ADR-011
 * A23). The rules follow typhonjs-escomplex 0.1 with its default settings (sloc, cyclomatic,
 * Halstead, parameters) and the JSX counting of the analysis (traverseHelper getLinesOfCode and
 * getMaxJSXNesting).
 */
export type MetricExplanation = {
    /** What the metric measures, in one or two sentences. */
    measures: string;
    /** Formula lines, shown as code. */
    formula: readonly string[];
    /** What counts and what does not. */
    notes: readonly string[];
};

const innerFunctions =
    'A function component counts its own body only: functions defined inside it, inline arrow ' +
    'functions too, have values of their own. A class component counts the whole class.';

export const metricExplanations: Readonly<Record<string, MetricExplanation>> = {
    'sloc.physical': {
        measures:
            'How many lines the component or function spans in its file, including comments ' +
            'and blank lines.',
        formula: ['lines = last line − first line + 1'],
        notes: [
            'A function component includes its inner functions; a class component the whole ' +
                'class.',
        ],
    },
    'sloc.jsx': {
        measures: 'How many lines of the component are JSX markup.',
        formula: ['JSX lines = Σ (last line − first line + 1) of every root JSX element'],
        notes: [
            'A root JSX element or fragment is one that is not inside another JSX element, so ' +
                'JSX in a { } expression of an element is not counted twice.',
            'JSX outside the returned markup, e.g. in a variable, counts as well.',
        ],
    },
    maxJsxNesting: {
        measures: 'How deeply the JSX markup of the component is nested.',
        formula: [
            'nesting = largest depth of a root JSX element',
            'depth(<element>) = 1 + largest depth of its children (0 without children)',
            'depth({ expression }) = 1 + largest depth of the JSX inside it',
            'depth(text) = 1',
        ],
        notes: [
            'Each child counts, text too: <div><span /></div> and <p>Hello</p> have nesting 2.',
            'Each { } expression adds a level: <ul>{items.map(item => <li />)}</ul> has ' +
                'nesting 3.',
        ],
    },
    cyclomatic: {
        measures:
            'How many independent paths lead through the code. Every branch is one more path ' +
            'to understand and to test.',
        formula: ['complexity = 1 + number of decision points'],
        notes: [
            'Decision points: if (also else if), ? :, &&, ||, case, for, while, do … while.',
            'Not counted: else, default, ??, ?., catch, for … in, for … of.',
            `${innerFunctions} A class component adds up its methods, each starting at 1.`,
        ],
    },
    'halstead.difficulty': {
        measures:
            'How hard the code is to write or to understand, e.g. in a code review: many ' +
            'different operators and operands used again and again make it harder.',
        formula: [
            'D = (n1 / 2) × (N2 / n2)',
            'n1 = distinct operators, n2 = distinct operands',
            'N2 = all uses of operands',
        ],
        notes: [
            'Operators are keywords and symbols such as =, +, ., ( ), if and return; operands ' +
                'are names and literal values.',
            'JSX tags and attributes are not counted, the code in { } is.',
            innerFunctions,
        ],
    },
    'halstead.bugs': {
        measures: 'An estimate of the number of errors in the code, derived from its size.',
        formula: [
            'B = V / 3000',
            'V = N × log2(n)   (Halstead volume)',
            'N = N1 + N2   (all uses of operators and operands)',
            'n = n1 + n2   (distinct operators and operands)',
        ],
        notes: [
            'Operators, operands and JSX are counted as for Halstead Difficulty.',
            innerFunctions,
        ],
    },
    paramCount: {
        measures: 'How many parameters the function takes, read from its signature.',
        formula: ['count = names in the parameter list'],
        notes: [
            'Destructured props count each name: ({ a, b }) is 2, a renamed ({ a: x }) is 2 ' +
                'as well, a default inside the braces ({ a = 1 }) also 2.',
            'A default value outside braces does not count: (a = 1) is 1; ...rest is 1; the ' +
                'arguments object is ignored.',
            'A class component adds up the parameters of all its methods.',
        ],
    },
};

/** Names of the threshold kinds of `qualityMetrics`. */
export const thresholdKinds: Readonly<Record<string, string>> = {
    component: 'component',
    innerFunction: 'inner function',
    'innerFunction.render': 'render',
};
