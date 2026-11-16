import type { ReactNode } from 'react';
import './Kbd.css';

type KbdProps = { children: ReactNode };

/** A key or shortcut, e.g. `<Kbd>Ctrl</Kbd> <Kbd>K</Kbd>`. */
export const Kbd = ({ children }: KbdProps) => (
    <>
        <kbd className="cc-kbd">{children}</kbd>
    </>
);
