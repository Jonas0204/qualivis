import type { View } from '@qualivis/core';
import type { CSSProperties } from 'react';
import { FunctionIcon } from './FunctionIcon';
import { LinkIcon } from './LinkIcon';
import { NodeIcon } from './NodeIcon';

export type IconVariant =
    | 'functionComponent'
    | 'classComponent'
    | 'innerReactFunction'
    | 'innerReactJSXFunction'
    | 'innerFunction'
    | 'innerJSXFunction'
    | 'link'
    | 'dashedLink';

export type IconSize = 'small' | 'medium' | 'large';

/** Edge length in px; medium is the size of the legend symbols (radius 12 plus margin). */
const sizes: Record<IconSize, number> = { small: 16, medium: 26, large: 36 };

export type IconProps = {
    variant: IconVariant;
    size?: IconSize;
    /** Only for the function variants: they look different in the component and the app view. */
    view?: View;
    className?: string;
    style?: CSSProperties;
};

const symbol = (variant: IconVariant, component: boolean) => {
    switch (variant) {
        case 'functionComponent':
            return <NodeIcon type="component" kind="FunctionComponent" />;
        case 'classComponent':
            return <NodeIcon type="component" kind="ClassComponent" />;
        case 'innerReactFunction':
            return <FunctionIcon special component={component} />;
        case 'innerReactJSXFunction':
            return <FunctionIcon special returnsJSX component={component} />;
        case 'innerFunction':
            return <FunctionIcon component={component} />;
        case 'innerJSXFunction':
            return <FunctionIcon returnsJSX component={component} />;
        case 'link':
            return <LinkIcon />;
        case 'dashedLink':
            return <LinkIcon dashArray="4 2" />;
    }
};

/**
 * One entry point for the symbols of the graph: an svg whose viewBox is 26 × 26 centred on 0, drawn
 * in the given size. A new icon needs a component in this folder, a variant and a case in `symbol`.
 */
export const Icon = ({
    variant,
    size = 'medium',
    view = 'component',
    className,
    style,
}: IconProps) => (
    <svg
        className={className}
        style={style}
        width={sizes[size]}
        height={sizes[size]}
        viewBox="-13 -13 26 26"
        overflow="visible" // the arrowhead sticks out past the edge
        aria-hidden="true"
    >
        {symbol(variant, view === 'component')}
    </svg>
);
