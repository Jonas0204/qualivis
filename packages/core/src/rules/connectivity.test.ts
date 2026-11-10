import { describe, expect, it } from 'vitest';
import type { Graph } from '../model/graph';
import { connectedNodes, isLinkHighlighted, type LinkEnds, withoutNodes } from './connectivity';

const link = (source: string, target: string): LinkEnds => ({
    source: { id: source },
    target: { id: target },
});

// Chain a → b → c → d, plus e → c.
const chain = [link('a', 'b'), link('b', 'c'), link('c', 'd'), link('e', 'c')];

describe('connectedNodes', () => {
    it('finds incoming, outgoing and indirect nodes along outgoing links', () => {
        expect(connectedNodes('b', chain, { indirect: true })).toEqual({
            incoming: ['a'],
            outgoing: ['c'],
            indirect: ['d'],
        });
    });

    it('finds no indirect nodes without the setting', () => {
        expect(connectedNodes('b', chain, { indirect: false }).indirect).toEqual([]);
    });

    it('stops in a cycle and leaves out the focus and nodes already found', () => {
        // a → b → c → a and c → b: from b the search reaches a, then b and c again.
        const cycle = [link('a', 'b'), link('b', 'c'), link('c', 'a'), link('c', 'b')];

        expect(connectedNodes('b', cycle, { indirect: true })).toEqual({
            incoming: ['a', 'c'],
            outgoing: ['c'],
            indirect: ['a'],
        });
    });

    it('lists a node once even when two links lead to it', () => {
        const twice = [
            link('a', 'b'),
            link('a', 'b'),
            link('a', 'c'),
            link('b', 'd'),
            link('c', 'd'),
        ];

        expect(connectedNodes('a', twice, { indirect: true })).toEqual({
            incoming: [],
            outgoing: ['b', 'c'],
            indirect: ['d'],
        });
    });

    it('searches breadth-first, round by round', () => {
        const tree = [
            link('a', 'b'),
            link('a', 'c'),
            link('b', 'd'),
            link('d', 'f'),
            link('c', 'e'),
        ];

        expect(connectedNodes('a', tree, { indirect: true }).indirect).toEqual(['d', 'e', 'f']);
    });
});

describe('isLinkHighlighted', () => {
    const { outgoing, indirect } = connectedNodes('b', chain, { indirect: true });
    const outgoingAndIndirect = new Set([...outgoing, ...indirect]);

    it('keeps links that touch the focus', () => {
        expect(isLinkHighlighted(link('a', 'b'), 'b', outgoingAndIndirect)).toBe(true);
        expect(isLinkHighlighted(link('b', 'c'), 'b', outgoingAndIndirect)).toBe(true);
    });

    it('keeps links between outgoing and indirect nodes', () => {
        expect(isLinkHighlighted(link('c', 'd'), 'b', outgoingAndIndirect)).toBe(true);
    });

    it('fades the other links', () => {
        expect(isLinkHighlighted(link('e', 'c'), 'b', outgoingAndIndirect)).toBe(false);
    });
});

describe('withoutNodes', () => {
    const graph: Graph = {
        nodes: [{ id: 'a' }, { id: 'b' }, { id: 'c' }],
        links: [
            { source: 'a', target: 'b' },
            { source: 'b', target: 'c' },
            { source: 'a', target: 'c' },
        ],
    };

    it('drops the nodes and every link that touches them', () => {
        expect(withoutNodes(graph, ['b'])).toEqual({
            nodes: [{ id: 'a' }, { id: 'c' }],
            links: [{ source: 'a', target: 'c' }],
        });
    });

    it('returns the graph itself when nothing is removed', () => {
        expect(withoutNodes(graph, [])).toBe(graph);
    });
});
