/** Joins class names and skips empty ones: `cx('a', on && 'b', className)`. */
export const cx = (...names: (string | false | null | undefined)[]) =>
    names.filter(Boolean).join(' ');
