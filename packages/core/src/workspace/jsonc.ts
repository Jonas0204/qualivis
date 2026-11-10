import type { SourceFile } from '../analysis/analyzeProject';

const whitespace = /^\s+$/;

/** Index after the closing quote of the string that starts at `start`, honouring escapes. */
const endOfString = (text: string, start: number): number => {
    let i = start + 1;
    while (i < text.length && text[i] !== '"') {
        i += text[i] === '\\' ? 2 : 1;
    }
    return i + 1;
};

/** Index of the line break that ends the line comment at `start`, or the end of the text. */
const endOfLine = (text: string, start: number): number => {
    let i = start;
    while (i < text.length && text[i] !== '\n' && text[i] !== '\r') {
        i++;
    }
    return i;
};

/** The string, the comment or the single character that starts at `start`, and where it ends. */
const segmentAt = (text: string, start: number): { comment: boolean; end: number } => {
    if (text[start] === '"') {
        return { comment: false, end: endOfString(text, start) };
    }
    if (text.startsWith('//', start)) {
        return { comment: true, end: endOfLine(text, start) };
    }
    if (text.startsWith('/*', start)) {
        const close = text.indexOf('*/', start + 2);
        return { comment: true, end: close === -1 ? text.length : close + 2 };
    }
    return { comment: false, end: start + 1 };
};

/**
 * Parses JSON with comments and trailing commas (JSONC), the format of tsconfig.json: removes `//`
 * and block comments and the commas before `}` and `]` outside strings, then calls JSON.parse.
 * Throws a SyntaxError for invalid input.
 */
export const parseJsonc = (text: string): unknown => {
    const parts: string[] = [];
    // Index in parts of the last comma, as long as only whitespace and comments follow it.
    let comma = -1;
    let i = 0;
    while (i < text.length) {
        const { comment, end } = segmentAt(text, i);
        // A space keeps the tokens on both sides of a comment apart: '1/**/2' stays invalid.
        const part = comment ? ' ' : text.slice(i, end);
        if ((part === '}' || part === ']') && comma >= 0) {
            parts[comma] = ' ';
        }
        // A string keeps its quotes, so only a real comma or bracket matches here.
        if (part === ',') {
            comma = parts.length;
        } else if (!whitespace.test(part)) {
            comma = -1;
        }
        parts.push(part);
        i = end;
    }
    return JSON.parse(parts.join(''));
};

/** True for a JSON object (not null, not an array). */
export const isRecord = (value: unknown): value is Record<string, unknown> =>
    typeof value === 'object' && value !== null && !Array.isArray(value);

const parseObject = (text: string): Record<string, unknown> => {
    const value = parseJsonc(text);
    if (!isRecord(value)) {
        throw new SyntaxError('Expected a JSON object');
    }
    return value;
};

/** The object in a package.json or tsconfig.json; undefined with a warning if it is invalid. */
export const readConfigFile = (file: SourceFile): Record<string, unknown> | undefined => {
    try {
        return parseObject(file.code);
    } catch (error) {
        // biome-ignore lint/suspicious/noConsole: says which config the analysis skips (ADR-019)
        console.warn('Invalid config file:', file.path, error);
        return undefined;
    }
};
