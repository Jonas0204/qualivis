import { describe, expect, it } from 'vitest';
import type { Node } from '../model/graph';
import { reactConstraints } from './reactConstraints';

const nodes = (...ids: string[]): Node[] => ids.map(id => ({ id }));

describe('reactConstraints', () => {
    it('orders React methods like reactMethods, render last', () => {
        // indexes: App 0, render 1, constructor 2, componentDidMount 3
        expect(
            reactConstraints(nodes('App', 'render', 'constructor', 'componentDidMount'))
        ).toEqual([
            { axis: 'x', left: 2, right: 3, gap: 100 },
            { axis: 'x', left: 3, right: 1, gap: 100 },
        ]);
    });

    it('keeps legacy quirk V4: no constraint towards the node at index 0', () => {
        // indexes: render 0, constructor 1, componentDidMount 2 → the pair 2 → 0 is skipped
        expect(reactConstraints(nodes('render', 'constructor', 'componentDidMount'))).toEqual([
            { axis: 'x', left: 1, right: 2, gap: 100 },
        ]);
    });

    it('ignores other functions and takes the gap from the caller', () => {
        expect(reactConstraints(nodes('App', 'helper', 'componentDidMount', 'render'), 40)).toEqual(
            [{ axis: 'x', left: 2, right: 3, gap: 40 }]
        );
    });

    it('gives no constraints without React methods', () => {
        expect(reactConstraints(nodes('App', 'helper'))).toEqual([]);
    });
});
