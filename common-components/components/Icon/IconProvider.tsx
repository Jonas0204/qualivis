import { type ReactNode, useContext, useMemo } from 'react';
import { type IconSet, IconSetContext } from './iconSet';

export type IconProviderProps = { icons: IconSet; children: ReactNode };

/**
 * Makes own SVG icons available to every Icon inside, by name. A nested provider adds to the icons
 * of the outer one. Pass a constant set, so that the icons are not merged again on every render.
 */
export const IconProvider = ({ icons, children }: IconProviderProps) => {
    const outer = useContext(IconSetContext);
    const merged = useMemo(() => ({ ...outer, ...icons }), [outer, icons]);
    return <IconSetContext value={merged}>{children}</IconSetContext>;
};
