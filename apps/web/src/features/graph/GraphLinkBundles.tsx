import { graphSettings, type View, type VisualLink } from '@qualivis/core';
import { memo, useCallback, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { countEvent } from '../../lib/perfStats';
import {
    bundleLinks,
    type LinkBundle,
    type LinkBundles,
    linkPathData,
    linkWriters,
} from './linkPaths';
import type { GraphFade } from './useFade';
import type { Bounds } from './zoomMath';

type GraphLinkBundlesProps = {
    links: readonly VisualLink[];
    view: View;
    /** Undefined while nothing is faded. */
    fade?: GraphFade<VisualLink>;
    /** Width of the lines as set by zooming; the arrow heads are that many times larger. */
    strokeWidth: number;
};

const bundleKeys = ['kept', 'rest'] as const;

const lineStyle = { fill: 'none', strokeWidth: graphSettings.linkStrokeWidth };

/** The path data of one bundle in the order its paths are drawn: solid, dashed, heads. */
const bundlePaths = (bundle: LinkBundle, view: View, strokeWidth: number, area?: Bounds) => {
    const solid = linkPathData(bundle.solid, view, strokeWidth, area);
    const dashed = linkPathData(bundle.dashed, view, strokeWidth, area);
    return [solid.lines, dashed.lines, solid.heads + dashed.heads];
};

/**
 * The links of a large graph (largeGraph.bundledLinks) as a few paths instead of one line with a
 * marker each: the browser lays out and paints six elements instead of thousands in every frame of
 * the layout (P08-S09). They look like the lines of GraphLink, except that lines of one path do
 * not darken where they cross. The links that fade (useFade) are a group of their own; after the
 * fading they stay in it, so that they ease back like the single lines do.
 */
export const GraphLinkBundles = memo(
    ({ links, view, fade, strokeWidth }: GraphLinkBundlesProps) => {
        countEvent('render.GraphLinkBundles');
        const [split, setSplit] = useState<{
            links: readonly VisualLink[];
            opaque: ReadonlySet<VisualLink>;
        }>();
        if (fade && (split?.opaque !== fade.opaqueLinks || split.links !== links)) {
            setSplit({ links, opaque: fade.opaqueLinks });
        }
        const opaque = fade?.opaqueLinks ?? (split?.links === links ? split.opaque : undefined);
        const bundles: LinkBundles = useMemo(() => bundleLinks(links, opaque), [links, opaque]);
        const layerRef = useRef<SVGGElement>(null);

        const write = useCallback(
            (area?: Bounds) => {
                const groups = layerRef.current?.children ?? [];
                bundleKeys.forEach((key, groupIndex) => {
                    const paths = groups[groupIndex]?.children ?? [];
                    bundlePaths(bundles[key], view, strokeWidth, area).forEach((d, index) => {
                        paths[index]?.setAttribute('d', d);
                    });
                });
            },
            [bundles, view, strokeWidth]
        );

        useLayoutEffect(() => {
            const layer = layerRef.current;
            if (!layer) {
                return;
            }
            linkWriters.set(layer, { links, write });
            return () => {
                linkWriters.delete(layer);
            };
        }, [links, write]);

        return (
            <g
                ref={layerRef}
                className="links"
                stroke={graphSettings.linkColor}
                strokeOpacity={graphSettings.linkOpacity}
            >
                {bundleKeys.map(key => {
                    const [solid, dashed, heads] = bundlePaths(bundles[key], view, strokeWidth);
                    return (
                        <g
                            key={key}
                            className="link-bundle"
                            style={
                                key === 'rest' && fade
                                    ? { opacity: graphSettings.fadeOpacity }
                                    : undefined
                            }
                        >
                            <path className="link-lines" d={solid} {...lineStyle} />
                            <path
                                className="link-lines"
                                d={dashed}
                                strokeDasharray="4 2"
                                {...lineStyle}
                            />
                            {/* Like the marker (GraphDefs), which is not see-through. */}
                            <path d={heads} fill={graphSettings.linkColor} stroke="none" />
                        </g>
                    );
                })}
            </g>
        );
    }
);
