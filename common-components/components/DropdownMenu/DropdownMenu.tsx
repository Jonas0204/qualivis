import {
    type KeyboardEvent,
    type ReactNode,
    type RefObject,
    useEffect,
    useId,
    useRef,
} from 'react';
import { cx } from '../../lib/cx';
import { type Align, type Side, useAnchoredPopover } from '../../lib/floating';
import { Icon } from '../Icon/Icon';
import '../../lib/floating.css';
import './DropdownMenu.css';

export type MenuEntry =
    | {
          type?: 'item';
          label: ReactNode;
          onSelect: () => void;
          /** Material icon name. */
          icon?: string;
          /** Shown on the right, e.g. "Ctrl+D". Only a hint; the key itself is not bound. */
          shortcut?: string;
          danger?: boolean;
          disabled?: boolean;
      }
    | { type: 'separator' }
    | { type: 'label'; label: ReactNode };

/** Props for the button that opens the menu. */
export type MenuTriggerProps = {
    ref: RefObject<HTMLButtonElement | null>;
    id: string;
    popoverTarget: string;
    'aria-haspopup': 'menu';
    'aria-expanded': boolean;
    'aria-controls': string;
};

type DropdownMenuProps = {
    /** Renders the button that opens the menu: `props => <Button {...props} />`. */
    trigger: (props: MenuTriggerProps) => ReactNode;
    items: readonly MenuEntry[];
    side?: Side;
    align?: Align;
};

const itemSelector = '[role="menuitem"]:not([aria-disabled="true"])';

/**
 * Menu of actions below a button (WAI-ARIA menu button). Arrow keys, Home and End move through the
 * items, Enter chooses, Escape and Tab close. Native popover API: a click outside closes it too.
 */
export const DropdownMenu = ({ trigger, items, side, align }: DropdownMenuProps) => {
    const id = useId();
    const anchorRef = useRef<HTMLButtonElement>(null);
    const menuRef = useRef<HTMLDivElement>(null);
    const open = useAnchoredPopover(anchorRef, menuRef, side, align);

    const menuItems = () => [
        ...(menuRef.current?.querySelectorAll<HTMLElement>(itemSelector) ?? []),
    ];

    // The first item gets the focus when the menu opens.
    useEffect(() => {
        if (open) {
            menuItems()[0]?.focus();
        }
    }, [open]);

    const close = () => {
        menuRef.current?.hidePopover();
        anchorRef.current?.focus();
    };

    const handleKeyDown = (event: KeyboardEvent) => {
        if (event.key === 'Tab') {
            menuRef.current?.hidePopover();
            return;
        }
        const all = menuItems();
        const index = all.indexOf(document.activeElement as HTMLElement);
        const last = all.length - 1;
        const moves: Record<string, number> = {
            ArrowDown: index >= last ? 0 : index + 1,
            ArrowUp: index <= 0 ? last : index - 1,
            Home: 0,
            End: last,
        };
        const next = all[moves[event.key] ?? -1];
        if (next) {
            event.preventDefault();
            next.focus();
        }
    };

    const entry = (item: MenuEntry, index: number) => {
        if (item.type === 'separator') {
            return <hr key={index} className="cc-menu__separator" />;
        }
        if (item.type === 'label') {
            return (
                <div key={index} role="presentation" className="cc-menu__label">
                    {item.label}
                </div>
            );
        }
        return (
            <button
                key={index}
                type="button"
                role="menuitem"
                tabIndex={-1}
                aria-disabled={item.disabled || undefined}
                data-danger={item.danger || undefined}
                className="cc-menu__item"
                onClick={() => {
                    if (!item.disabled) {
                        close();
                        item.onSelect();
                    }
                }}
            >
                {item.icon && <Icon name={item.icon} />}
                <span className="cc-menu__text">{item.label}</span>
                {item.shortcut && <span className="cc-menu__shortcut">{item.shortcut}</span>}
            </button>
        );
    };

    return (
        <>
            {trigger({
                ref: anchorRef,
                id: `${id}-trigger`,
                popoverTarget: id,
                'aria-haspopup': 'menu',
                'aria-expanded': open,
                'aria-controls': id,
            })}
            <div
                ref={menuRef}
                id={id}
                popover="auto"
                role="menu"
                aria-labelledby={`${id}-trigger`}
                className={cx('cc-floating', 'cc-menu')}
                onKeyDown={handleKeyDown}
            >
                {items.map(entry)}
            </div>
        </>
    );
};
