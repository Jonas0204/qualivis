import { describe, expect, it } from 'vitest';
import { propsEqualOneLevel } from './propsEqualOneLevel';

type Props = { node?: object; onClick?: () => void; style?: object; ids?: unknown; a?: unknown };

const equal = propsEqualOneLevel<Props>('style');

describe('propsEqualOneLevel', () => {
    const node = { id: 'a' };
    const onClick = () => undefined;

    it('compares the other props by identity, also plain objects', () => {
        expect(equal({ node, onClick }, { node, onClick })).toBe(true);
        expect(equal({ node }, { node: { id: 'a' } })).toBe(false);
        expect(equal({ onClick }, { onClick: () => undefined })).toBe(false);
    });

    it('compares a named object prop by its own values, one level deep', () => {
        expect(
            equal(
                { style: { fill: 'red', opacity: undefined } },
                { style: { fill: 'red', opacity: undefined } }
            )
        ).toBe(true);
        expect(equal({ style: { fill: 'red' } }, { style: { fill: 'blue' } })).toBe(false);
        expect(equal({ style: { fill: 'red' } }, { style: {} })).toBe(false);
        expect(equal({ style: { a: undefined } }, { style: { b: undefined } })).toBe(false);
        expect(equal({ style: { node } }, { style: { node: { id: 'a' } } })).toBe(false);
        expect(equal({ style: { fill: 'red' } }, { style: undefined })).toBe(false);
    });

    it('counts added, missing and undefined props', () => {
        expect(equal({ a: 1 }, { a: 1, ids: 2 })).toBe(false);
        expect(equal({ a: 1, ids: 2 }, { a: 1 })).toBe(false);
        expect(equal({ a: undefined }, { ids: undefined })).toBe(false);
        expect(equal({ a: Number.NaN }, { a: Number.NaN })).toBe(true);
    });
});
