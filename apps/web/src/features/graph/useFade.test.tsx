import type { LinkEnds } from '@qualivis/core';
import { act } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { renderHookWithState } from '../../test/renderWithState';
import { type FadeSettings, useFade } from './useFade';

const link = (source: string, target: string): LinkEnds => ({
    source: { id: source },
    target: { id: target },
});

// a → b → c → d, plus e → c.
const links = [link('a', 'b'), link('b', 'c'), link('c', 'd'), link('e', 'c')];
const on: FadeSettings = { fade: true, highlightIndirectNodes: true };

const renderFade = (settings: FadeSettings = on) => {
    const layout = { run: 1 };
    return { layout, ...renderHookWithState(() => useFade(links, layout.run, settings)) };
};

describe('useFade', () => {
    it('keeps the node, its neighbours and the nodes reached from it, and fades the rest', () => {
        const { result } = renderFade();

        act(() => result.current.fadeTo('b'));

        const faded = result.current.faded;
        expect([...(faded?.opaqueNodes ?? [])].sort()).toEqual(['a', 'b', 'c', 'd']);
        expect([...(faded?.indirectNodes ?? [])]).toEqual(['d']);
        expect([...(faded?.opaqueLinks ?? [])]).toEqual([links[0], links[1], links[2]]);
    });

    it('shows everything again', () => {
        const { result } = renderFade();
        act(() => result.current.fadeTo('b'));

        act(() => result.current.fadeIn());

        expect(result.current.faded).toBeUndefined();
    });

    it('does not fade without the setting "fade"', () => {
        const { result } = renderFade({ ...on, fade: false });

        act(() => result.current.fadeTo('b'));

        expect(result.current.faded).toBeUndefined();
    });

    it('fades the indirect nodes too without "highlight indirect nodes"', () => {
        const { result } = renderFade({ ...on, highlightIndirectNodes: false });

        act(() => result.current.fadeTo('b'));

        expect([...(result.current.faded?.opaqueNodes ?? [])].sort()).toEqual(['a', 'b', 'c']);
        expect(result.current.faded?.indirectNodes.size).toBe(0);
        expect([...(result.current.faded?.opaqueLinks ?? [])]).toEqual([links[0], links[1]]);
    });

    it('neither fades nor shows everything while a node is dragged', () => {
        const { result } = renderFade();
        act(() => result.current.fadeTo('b'));

        result.current.onDraggingChange(true);
        act(() => result.current.fadeTo('d'));
        act(() => result.current.fadeIn());
        expect(result.current.faded?.opaqueNodes.has('a')).toBe(true);

        result.current.onDraggingChange(false);
        act(() => result.current.fadeIn());
        expect(result.current.faded).toBeUndefined();
    });

    it('shows everything after a restart of the layout', () => {
        const { result, rerender, layout } = renderFade();
        act(() => result.current.fadeTo('b'));

        layout.run = 2;
        rerender();

        expect(result.current.faded).toBeUndefined();
    });
});
