const sameValues = (a: unknown, b: unknown): boolean => {
    if (typeof a !== 'object' || typeof b !== 'object' || a === null || b === null) {
        return false;
    }
    const x = a as Record<string, unknown>;
    const y = b as Record<string, unknown>;
    const keys = Object.keys(x);
    return (
        keys.length === Object.keys(y).length &&
        keys.every(key => Object.hasOwn(y, key) && Object.is(x[key], y[key]))
    );
};

/**
 * Props comparison for `React.memo`: like the default (every prop by identity), but the named
 * object props (e.g. `{ fill, opacity }`, built anew on every render) count as equal when their own
 * values are equal, one level deep.
 */
export const propsEqualOneLevel =
    <P extends object>(...valueProps: readonly (keyof P & string)[]) =>
    (previous: P, next: P): boolean => {
        const a = previous as Record<string, unknown>;
        const b = next as Record<string, unknown>;
        const keys = Object.keys(a);
        if (keys.length !== Object.keys(b).length) {
            return false;
        }
        return keys.every(
            key =>
                Object.hasOwn(b, key) &&
                (Object.is(a[key], b[key]) ||
                    ((valueProps as readonly string[]).includes(key) && sameValues(a[key], b[key])))
        );
    };
