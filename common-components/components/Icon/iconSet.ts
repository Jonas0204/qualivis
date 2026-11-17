import { createContext, type ReactNode } from 'react';

/** An icon the host draws itself: the content of an svg and the viewBox it is drawn in. */
export type SvgIcon = { viewBox: string; content: ReactNode };

/** Own icons of the host by name; inside an IconProvider they take precedence over Material. */
export type IconSet = Readonly<Record<string, SvgIcon>>;

export const IconSetContext = createContext<IconSet>({});
