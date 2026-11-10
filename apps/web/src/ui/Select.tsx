import {
    type ComponentProps,
    type KeyboardEvent,
    type MouseEvent,
    useEffect,
    useId,
    useRef,
    useState,
} from 'react';
import styles from './Select.module.css';

export type SelectOption = { value: string; label: string };

export type SelectProps = Omit<
    ComponentProps<'button'>,
    'value' | 'onChange' | 'children' | 'aria-label' | 'color'
> & {
    value: string;
    options: readonly SelectOption[];
    /** Called only when another option is chosen. */
    onChange: (value: string) => void;
    'aria-label': string;
    /** Colour of the value; Material's default without it. */
    color?: string;
};

/**
 * Material-style select (mat-select in a mat-form-field without label, 180 px wide). The button
 * shows the value; its list is a listbox below it. Keys as in mat-select: arrows change the value
 * while the list is closed and move through the list while it is open, Enter and Space open the
 * list or choose, Escape and Tab close it. A press outside closes it too.
 */
export const Select = ({
    value,
    options,
    onChange,
    color,
    className,
    onClick,
    onKeyDown,
    onKeyUp,
    ...props
}: SelectProps) => {
    const id = useId();
    const listId = `${id}-list`;
    const optionId = (index: number) => `${id}-option-${index}`;
    const rootRef = useRef<HTMLDivElement>(null);
    const listRef = useRef<HTMLDivElement>(null);
    const [open, setOpen] = useState(false);
    const [active, setActive] = useState(0);
    const selectedIndex = options.findIndex(option => option.value === value);
    const last = options.length - 1;

    const openList = () => {
        setActive(Math.max(selectedIndex, 0));
        setOpen(true);
    };

    const choose = (index: number) => {
        setOpen(false);
        const option = options[index];
        if (option && option.value !== value) {
            onChange(option.value);
        }
    };

    useEffect(() => {
        if (!open) {
            return;
        }
        const closeOutside = (event: PointerEvent) => {
            if (!(event.target instanceof Node && rootRef.current?.contains(event.target))) {
                setOpen(false);
            }
        };
        document.addEventListener('pointerdown', closeOutside);
        return () => document.removeEventListener('pointerdown', closeOutside);
    }, [open]);

    // Keeps the active option in view; jsdom has no scrollIntoView.
    useEffect(() => {
        if (open) {
            listRef.current?.children[active]?.scrollIntoView?.({ block: 'nearest' });
        }
    }, [open, active]);

    const handleClick = (event: MouseEvent<HTMLButtonElement>) => {
        onClick?.(event);
        if (open) {
            setOpen(false);
        } else {
            openList();
        }
    };

    const clamp = (index: number) => Math.min(Math.max(index, 0), last);
    const isArrow = (key: string) => key === 'ArrowDown' || key === 'ArrowUp';
    const step = (key: string) => (key === 'ArrowDown' ? 1 : -1);
    const isChoice = (key: string) => key === 'Enter' || key === ' ';

    /** Keys while the list is closed; true when handled. */
    const closedKey = (key: string) => {
        if (isArrow(key)) {
            choose(clamp(selectedIndex + step(key)));
        } else if (isChoice(key)) {
            openList();
        } else {
            return false;
        }
        return true;
    };

    /** Keys while the list is open; true when handled. Tab closes and moves the focus on. */
    const openKey = (key: string) => {
        if (key === 'Escape' || key === 'Tab') {
            setOpen(false);
            return key === 'Escape';
        }
        if (isChoice(key)) {
            choose(active);
            return true;
        }
        const moves: Record<string, number> = {
            ArrowDown: active + 1,
            ArrowUp: active - 1,
            Home: 0,
            End: last,
        };
        const next = moves[key];
        if (next === undefined) {
            return false;
        }
        setActive(clamp(next));
        return true;
    };

    const handleKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
        onKeyDown?.(event);
        if ((open ? openKey : closedKey)(event.key)) {
            event.preventDefault();
        }
    };

    return (
        <div ref={rootRef} className={className ? `${styles.select} ${className}` : styles.select}>
            <button
                type="button"
                role="combobox"
                aria-haspopup="listbox"
                aria-expanded={open}
                aria-controls={listId}
                aria-activedescendant={open ? optionId(active) : undefined}
                {...props}
                className={styles.trigger}
                onClick={handleClick}
                onKeyDown={handleKeyDown}
                onKeyUp={event => {
                    onKeyUp?.(event);
                    // Space is handled on key down; its key up must not click the button.
                    if (event.key === ' ') {
                        event.preventDefault();
                    }
                }}
            >
                <span className={styles.value} style={{ color }}>
                    {options[selectedIndex]?.label}
                </span>
                <span className={styles.arrow} />
            </button>
            {open && (
                <div
                    ref={listRef}
                    id={listId}
                    role="listbox"
                    aria-label={props['aria-label']}
                    className={styles.list}
                >
                    {options.map((option, index) => (
                        // biome-ignore lint/a11y/useKeyWithClickEvents: the keys go to the button, which keeps the focus (aria-activedescendant)
                        <div
                            key={option.value}
                            id={optionId(index)}
                            role="option"
                            tabIndex={-1}
                            aria-selected={index === selectedIndex}
                            className={[
                                styles.option,
                                index === active && styles.active,
                                index === selectedIndex && styles.selected,
                            ]
                                .filter(Boolean)
                                .join(' ')}
                            onClick={() => choose(index)}
                        >
                            {option.label}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};
