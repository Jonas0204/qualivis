import { previewClassName } from '@qualivis/core';
import { NodeIcon } from './NodeIcon';

export type FunctionIconProps = {
    special?: boolean;
    returnsJSX?: boolean;
    /** Component view: functions are drawn node-sized; otherwise as small preview circles. */
    component: boolean;
};

/**
 * An inner function as symbol. In the component view, JSX functions are nodes; the others keep the
 * preview colours of the app view, as in the legacy legend, in node size.
 */
export const FunctionIcon = ({ special, returnsJSX, component }: FunctionIconProps) =>
    component && returnsJSX ? (
        <NodeIcon type="innerFunction" special={special} returnsJSX={returnsJSX} />
    ) : (
        <circle
            className={previewClassName({ type: 'innerFunction', special, returnsJSX })}
            r={component ? 12 : 5}
            opacity={component ? undefined : 0.5}
        />
    );
