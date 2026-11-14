import type { VisualLink, VisualNode } from '@qualivis/core';
import { describe, expect, it } from 'vitest';
import { renderWithState } from '../../test/renderWithState';
import { GraphLinkBundles } from './GraphLinkBundles';
import type { GraphFade } from './useFade';

const node = (id: string, x: number, y: number): VisualNode => ({
    id,
    x,
    y,
    width: 48,
    height: 48,
    warn: false,
    error: false,
});

const a = node('a', 0, 0);
const b = node('b', 100, 0);
const c = node('c', 0, 200);
const composition: VisualLink = { source: a, target: b };
const inheritance: VisualLink = { source: a, target: c, inherits: true };
const links = [composition, inheritance];

const fadeTo = (...opaqueLinks: VisualLink[]): GraphFade<VisualLink> => ({
    opaqueNodes: new Set(),
    indirectNodes: new Set(),
    opaqueLinks: new Set(opaqueLinks),
});

const bundles = (container: HTMLElement) =>
    Array.from(container.querySelectorAll<SVGGElement>('g.links > g.link-bundle'), group => {
        const paths = Array.from(group.children, path => path.getAttribute('d'));
        // Solid lines, dashed lines; the third path has the heads of both.
        return { opacity: group.style.opacity, paths, lines: paths.slice(0, 2) };
    });

const draw = (fade?: GraphFade<VisualLink>) => {
    const ui = (shownFade?: GraphFade<VisualLink>) => (
        <svg role="img" aria-label="Test graph">
            <GraphLinkBundles links={links} view="component" fade={shownFade} strokeWidth={0.8} />
        </svg>
    );
    const { container, rerender } = renderWithState(ui(fade));
    return { container, show: (next?: GraphFade<VisualLink>) => rerender(ui(next)) };
};

describe('GraphLinkBundles', () => {
    it('draws all links as one path of solid lines, one of dashed lines and one of heads', () => {
        const { container } = draw();
        const [kept, rest] = bundles(container);

        expect(kept?.paths[0]).toBe('M0,0L75.5,0');
        expect(kept?.paths[1]).toBe('M0,0L0,175.5');
        expect(kept?.paths[2]?.match(/Z/g)).toHaveLength(2);
        expect(rest).toMatchObject({ opacity: '', paths: ['', '', ''] });
        const dashed = container.querySelectorAll('g.link-bundle')[0]?.children[1];
        expect(dashed?.getAttribute('stroke-dasharray')).toBe('4 2');
        expect(container.querySelectorAll('line, [marker-end]')).toHaveLength(0);
    });

    it('fades the links that do not stay visible, as a group', () => {
        const { container } = draw(fadeTo(inheritance));
        const [kept, rest] = bundles(container);

        expect(kept).toMatchObject({ opacity: '', lines: ['', 'M0,0L0,175.5'] });
        expect(rest).toMatchObject({ opacity: '0.1', lines: ['M0,0L75.5,0', ''] });
    });

    it('leaves the faded links in their group when the fading ends, so that they ease back', () => {
        const { container, show } = draw(fadeTo(inheritance));

        show(undefined);

        const [kept, rest] = bundles(container);
        expect(kept).toMatchObject({ opacity: '', lines: ['', 'M0,0L0,175.5'] });
        expect(rest).toMatchObject({ opacity: '', lines: ['M0,0L75.5,0', ''] });
    });
});
