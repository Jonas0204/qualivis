import type { ReactNode } from 'react';
import styles from './AppShell.module.css';
import { Toolbar } from './Toolbar';

type AppShellProps = { children: ReactNode };

/** Page layout like the legacy app component: sticky toolbar above the content area. */
export const AppShell = ({ children }: AppShellProps) => (
  <div className={styles.shell}>
    <Toolbar />
    <div className={styles.content}>{children}</div>
  </div>
);
