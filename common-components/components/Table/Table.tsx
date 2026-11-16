import type { ComponentProps, ReactNode } from 'react';
import { cx } from '../../lib/cx';
import './Table.css';

type TableProps = ComponentProps<'table'> & {
    /** Short description, shown below the table. */
    caption?: ReactNode;
};

/**
 * Data table in a frame that scrolls sideways when it is too wide. Write `thead`, `tbody`, `tr`,
 * `th` and `td` as usual; `data-align="end"` right-aligns a cell (numbers).
 */
export const Table = ({ caption, className, children, ...props }: TableProps) => (
    <>
        <div className="cc-table-frame">
            <table {...props} className={cx('cc-table', className)}>
                {caption !== undefined && <caption>{caption}</caption>}
                {children}
            </table>
        </div>
    </>
);
