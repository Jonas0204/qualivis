import { type KeyboardEvent, type ReactNode, useId, useRef, useState } from 'react';
import './Tabs.css';

export type TabItem = { id: string; label: ReactNode; content: ReactNode; disabled?: boolean };

type TabsProps = {
    /** Name of the tab list, for screen readers. */
    label: string;
    items: readonly TabItem[];
    /** Controlled tab id; or `defaultValue` (the first tab without either). */
    value?: string;
    defaultValue?: string;
    onChange?: (id: string) => void;
    variant?: 'line' | 'segmented';
};

/**
 * Tabs after the WAI-ARIA pattern: arrow keys, Home and End move between the tabs and show the
 * tab at once; Tab goes on to the panel.
 */
export const Tabs = ({
    label,
    items,
    value,
    defaultValue,
    onChange,
    variant = 'line',
}: TabsProps) => {
    const id = useId();
    const listRef = useRef<HTMLDivElement>(null);
    const [ownValue, setOwnValue] = useState(defaultValue ?? items[0]?.id);
    const current = value ?? ownValue;
    const enabled = items.filter(item => !item.disabled);

    const select = (tabId: string) => {
        setOwnValue(tabId);
        if (tabId !== current) {
            onChange?.(tabId);
        }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
        const index = enabled.findIndex(item => item.id === current);
        const last = enabled.length - 1;
        const moves: Record<string, number> = {
            ArrowRight: index >= last ? 0 : index + 1,
            ArrowLeft: index <= 0 ? last : index - 1,
            Home: 0,
            End: last,
        };
        const next = enabled[moves[event.key] ?? -1];
        if (!next) {
            return;
        }
        event.preventDefault();
        select(next.id);
        listRef.current?.querySelector<HTMLElement>(`[data-tab="${CSS.escape(next.id)}"]`)?.focus();
    };

    return (
        <div className="cc-tabs" data-variant={variant}>
            <div
                ref={listRef}
                role="tablist"
                aria-label={label}
                className="cc-tabs__list"
                onKeyDown={handleKeyDown}
            >
                {items.map(item => (
                    <button
                        key={item.id}
                        type="button"
                        role="tab"
                        id={`${id}-tab-${item.id}`}
                        data-tab={item.id}
                        aria-selected={item.id === current}
                        aria-controls={`${id}-panel-${item.id}`}
                        tabIndex={item.id === current ? 0 : -1}
                        disabled={item.disabled}
                        className="cc-tabs__tab"
                        onClick={() => select(item.id)}
                    >
                        {item.label}
                    </button>
                ))}
            </div>
            {items.map(item => (
                <div
                    key={item.id}
                    role="tabpanel"
                    id={`${id}-panel-${item.id}`}
                    aria-labelledby={`${id}-tab-${item.id}`}
                    hidden={item.id !== current}
                    // biome-ignore lint/a11y/noNoninteractiveTabindex: the WAI-ARIA tabs pattern makes the panel focusable
                    tabIndex={0}
                    className="cc-tabs__panel"
                >
                    {item.content}
                </div>
            ))}
        </div>
    );
};
