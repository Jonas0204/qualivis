/**
 * Expressions that only exist for the type checker (`value as T`, `value!`, `value satisfies T`,
 * `<T>value`, `fn<T>`) and parentheses. typhonjs-escomplex knows only ESTree and throws
 * "this[node.type] is not a function" on them, so the walk replaces each by its inner expression.
 */
const wrapperTypes = new Set([
    'TSAsExpression',
    'TSSatisfiesExpression',
    'TSNonNullExpression',
    'TSTypeAssertion',
    'TSInstantiationExpression',
    'ParenthesizedExpression',
]);

const skippedKeys = new Set(['loc', 'leadingComments', 'trailingComments', 'innerComments']);

type AnyNode = { type?: unknown; expression?: unknown; [key: string]: unknown };

const isNode = (value: unknown): value is AnyNode => typeof value === 'object' && value !== null;

const unwrap = (value: unknown): unknown => {
    let current = value;
    while (isNode(current) && typeof current.type === 'string' && wrapperTypes.has(current.type)) {
        current = current.expression;
    }
    return current;
};

/** Unwraps the children of one node in place and puts them on the stack. */
const visitChildren = (node: AnyNode, stack: unknown[]): void => {
    for (const key of Object.keys(node)) {
        if (skippedKeys.has(key)) continue;
        const child = node[key];
        if (Array.isArray(child)) {
            for (let i = 0; i < child.length; i++) {
                child[i] = unwrap(child[i]);
                stack.push(child[i]);
            }
        } else {
            node[key] = unwrap(child);
            stack.push(node[key]);
        }
    }
};

/** Replaces the wrapper expressions in the AST in place; returns the same AST. */
export const stripTypeWrappers = <T>(ast: T): T => {
    const stack: unknown[] = [ast];
    while (stack.length > 0) {
        const node = stack.pop();
        if (isNode(node)) visitChildren(node, stack);
    }
    return ast;
};
