import { afterEach, describe, expect, it, vi } from 'vitest';
import { parseJsonc, readConfigFile } from './jsonc';

afterEach(() => {
    vi.restoreAllMocks();
});

describe('parseJsonc', () => {
    it('removes line and block comments', () => {
        const text = [
            '// Shared options',
            '{',
            '  /* block',
            '     comment */',
            '  "a": 1, // trailing comment',
            '  "b": /* inline */ 2',
            '}',
        ].join('\r\n');
        expect(parseJsonc(text)).toEqual({ a: 1, b: 2 });
    });

    it('removes commas before } and ], also across whitespace and comments', () => {
        const text = '{ "a": [1, 2,], "b": { "c": 3, /* end */ }, // last\n }';
        expect(parseJsonc(text)).toEqual({ a: [1, 2], b: { c: 3 } });
    });

    it('keeps comment markers, commas and brackets inside strings', () => {
        const text = '{ "url": "http://x/*y*/", "list": "a,]", "quote": "say \\"//hi\\"" }';
        expect(parseJsonc(text)).toEqual({
            url: 'http://x/*y*/',
            list: 'a,]',
            quote: 'say "//hi"',
        });
    });

    it('keeps a comma before a string that contains spaces', () => {
        expect(parseJsonc('{ "include": ["src", "my components"] }')).toEqual({
            include: ['src', 'my components'],
        });
    });

    it('ends a string at the quote after an escaped backslash', () => {
        expect(parseJsonc('{ "dir": "c:\\\\", // comment\n "b": 1 }')).toEqual({
            dir: 'c:\\',
            b: 1,
        });
    });

    it('parses strict JSON like JSON.parse', () => {
        const text =
            '{"name":"@demo/ui","dependencies":{"react":"19.2.0"},"list":[1,"2",null,true]}';
        expect(parseJsonc(text)).toEqual(JSON.parse(text));
    });

    it.each([
        ['an unquoted key', '{ a: 1 }'],
        ['two commas', '[1,,]'],
        ['an unclosed block comment', '{ "a": 1 /* open'],
        ['two values a comment separated', '[1/* */2]'],
    ])('throws a SyntaxError for %s', (_case, text) => {
        expect(() => parseJsonc(text)).toThrow(SyntaxError);
    });
});

describe('readConfigFile', () => {
    it('returns the object of a config file', () => {
        expect(readConfigFile({ path: '/a/tsconfig.json', code: '{ "files": [], }' })).toEqual({
            files: [],
        });
    });

    it.each([
        ['invalid JSON', '{ "name": '],
        ['a value that is not an object', '["a"]'],
    ])('warns about %s and returns undefined', (_case, code) => {
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
        expect(readConfigFile({ path: '/a/package.json', code })).toBeUndefined();
        expect(warn).toHaveBeenCalledWith(
            'Invalid config file:',
            '/a/package.json',
            expect.any(SyntaxError)
        );
    });
});
