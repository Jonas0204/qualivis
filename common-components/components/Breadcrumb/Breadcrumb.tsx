import type { ReactNode } from 'react';
import './Breadcrumb.css';

export type BreadcrumbItem = {
    label: ReactNode;
    /** A link; or `onClick` for a step inside the app. */
    href?: string;
    onClick?: () => void;
};

type BreadcrumbProps = {
    /** From the top level down; the last item is the current page. */
    items: readonly BreadcrumbItem[];
    label?: string;
};

const step = (item: BreadcrumbItem) => {
    if (item.href !== undefined) {
        return <a href={item.href}>{item.label}</a>;
    }
    if (item.onClick) {
        return (
            <button type="button" onClick={item.onClick}>
                {item.label}
            </button>
        );
    }
    return <span>{item.label}</span>;
};

/** Path from the top level to the current place. */
export const Breadcrumb = ({ items, label = 'Breadcrumb' }: BreadcrumbProps) => (
    <>
        <nav className="cc-breadcrumb" aria-label={label}>
            <ol>
                {items.map((item, index) => (
                    // Items have no id; their place in the path is stable.
                    <li key={index}>
                        {index === items.length - 1 ? (
                            <span aria-current="page">{item.label}</span>
                        ) : (
                            step(item)
                        )}
                    </li>
                ))}
            </ol>
        </nav>
    </>
);
