import { type ReactNode, useId } from 'react';
import './Accordion.css';

export type AccordionItem = { id: string; title: ReactNode; content: ReactNode };

type AccordionProps = {
    items: readonly AccordionItem[];
    /** Only one item open at a time (native `<details name>`). */
    exclusive?: boolean;
    /** Ids of the items that start open. */
    defaultOpen?: readonly string[];
};

/** Sections that open and close; native `<details>`, so keyboard and find-in-page just work. */
export const Accordion = ({ items, exclusive = false, defaultOpen = [] }: AccordionProps) => {
    const name = useId();
    return (
        <div className="cc-accordion">
            {items.map(item => (
                <details
                    key={item.id}
                    className="cc-accordion__item"
                    name={exclusive ? name : undefined}
                    open={defaultOpen.includes(item.id) || undefined}
                >
                    <summary className="cc-accordion__summary">{item.title}</summary>
                    <div className="cc-accordion__content">{item.content}</div>
                </details>
            ))}
        </div>
    );
};
