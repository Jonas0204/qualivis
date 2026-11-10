import {
    Fragment,
    type KeyboardEvent,
    type PointerEvent,
    type ReactNode,
    useRef,
    useState,
} from 'react';
import styles from './SplitPane.module.css';

export type SplitArea = {
    key: string;
    /** Size in px, or `'*'` for the one area that takes the rest. */
    size: number | '*';
    /** A hidden area has size 0 and no gutter, but its content stays mounted. */
    visible?: boolean;
    /** Name of the area for the label of its gutter, e.g. "file tree". */
    label?: string;
    children: ReactNode;
};

export type SplitPaneProps = {
    /** `horizontal`: areas side by side; `vertical`: areas one below the other. */
    direction: 'horizontal' | 'vertical';
    areas: readonly SplitArea[];
    gutterSize?: number;
};

/** Pixels an arrow key moves a focused gutter. */
export const gutterKeyStep = 10;

type Drag = {
    pointerId: number;
    start: number;
    before: { key: string; size: number | undefined; extent: number };
    after: { key: string; size: number | undefined; extent: number };
};

const fixedSizes = (areas: readonly SplitArea[]) =>
    Object.fromEntries(
        areas.flatMap(area => (typeof area.size === 'number' ? [[area.key, area.size]] : []))
    );

/**
 * Areas with sizes in pixels and gutters to resize them, like angular-split with `unit="pixel"` in
 * the legacy app (graph-view.component.html, docs/migration/01-referenz-altsystem/04-stil-referenz.md
 * §3). Moving a gutter changes the two areas next to it; the `*` area takes what is left. No area
 * gets smaller than 0.
 */
export const SplitPane = ({ direction, areas, gutterSize = 8 }: SplitPaneProps) => {
    // Sizes of the fixed areas; they start from the props and then follow the gutters.
    const [sizes, setSizes] = useState<Record<string, number>>(() => fixedSizes(areas));
    const areaRefs = useRef(new Map<string, HTMLDivElement>());
    const dragRef = useRef<Drag>(undefined);
    const horizontal = direction === 'horizontal';

    const sizeOf = (area: SplitArea) =>
        typeof area.size === 'number' ? (sizes[area.key] ?? area.size) : undefined;

    /** Current extent of an area in px: its size, or for the `*` area what the browser gave it. */
    const extentOf = (area: SplitArea) => {
        const size = sizeOf(area);
        if (size !== undefined) {
            return size;
        }
        const element = areaRefs.current.get(area.key);
        return (horizontal ? element?.clientWidth : element?.clientHeight) ?? 0;
    };

    /** Moves the gutter between two areas by `delta` px from their extents at `from`. */
    const move = (from: Drag['before'], to: Drag['after'], delta: number) => {
        const total = from.extent + to.extent;
        const before = Math.min(Math.max(from.extent + delta, 0), total);
        setSizes(current => ({
            ...current,
            ...(from.size === undefined ? {} : { [from.key]: before }),
            ...(to.size === undefined ? {} : { [to.key]: total - before }),
        }));
    };

    const sides = (before: SplitArea, after: SplitArea) => ({
        before: { key: before.key, size: sizeOf(before), extent: extentOf(before) },
        after: { key: after.key, size: sizeOf(after), extent: extentOf(after) },
    });

    const position = (event: PointerEvent) => (horizontal ? event.clientX : event.clientY);

    const visibleAreas = areas.filter(area => area.visible !== false);

    const gutter = (before: SplitArea, after: SplitArea) => {
        const fixed = typeof before.size === 'number' ? before : after;
        const label = fixed.label ?? before.label ?? after.label;
        return (
            // biome-ignore lint/a11y/useSemanticElements: an <hr> cannot be focused and dragged
            <div
                className={styles.gutter}
                style={horizontal ? { width: gutterSize } : { height: gutterSize }}
                role="separator"
                tabIndex={0}
                // The gutter between columns is a vertical line.
                aria-orientation={horizontal ? 'vertical' : 'horizontal'}
                aria-label={label ? `Resize ${label}` : undefined}
                aria-valuenow={sizeOf(fixed) ?? 0}
                aria-valuemin={0}
                onPointerDown={event => {
                    if (event.button !== 0) {
                        return;
                    }
                    event.preventDefault();
                    event.currentTarget.setPointerCapture?.(event.pointerId);
                    dragRef.current = {
                        pointerId: event.pointerId,
                        start: position(event),
                        ...sides(before, after),
                    };
                }}
                onPointerMove={event => {
                    const drag = dragRef.current;
                    if (drag?.pointerId === event.pointerId) {
                        move(drag.before, drag.after, position(event) - drag.start);
                    }
                }}
                onPointerUp={event => {
                    if (dragRef.current?.pointerId === event.pointerId) {
                        dragRef.current = undefined;
                    }
                }}
                onPointerCancel={() => {
                    dragRef.current = undefined;
                }}
                onKeyDown={(event: KeyboardEvent) => {
                    const [less, more] = horizontal
                        ? ['ArrowLeft', 'ArrowRight']
                        : ['ArrowUp', 'ArrowDown'];
                    if (event.key !== less && event.key !== more) {
                        return;
                    }
                    event.preventDefault();
                    const { before: from, after: to } = sides(before, after);
                    move(from, to, event.key === more ? gutterKeyStep : -gutterKeyStep);
                }}
            >
                <div className={styles.gutterIcon} />
            </div>
        );
    };

    return (
        <div className={`${styles.split} ${horizontal ? styles.horizontal : styles.vertical}`}>
            {areas.map(area => {
                const visible = area.visible !== false;
                const index = visibleAreas.indexOf(area);
                const previous = index > 0 ? visibleAreas[index - 1] : undefined;
                const size = sizeOf(area);
                return (
                    <Fragment key={area.key}>
                        {visible && previous && gutter(previous, area)}
                        <div
                            ref={element => {
                                if (element) {
                                    areaRefs.current.set(area.key, element);
                                } else {
                                    areaRefs.current.delete(area.key);
                                }
                            }}
                            className={[
                                styles.area,
                                visible ? undefined : styles.hidden,
                                size === undefined ? styles.rest : undefined,
                            ]
                                .filter(Boolean)
                                .join(' ')}
                            style={
                                visible && size !== undefined
                                    ? { flexBasis: `${size}px` }
                                    : undefined
                            }
                            data-area={area.key}
                            // Out of reach for keyboard and screen readers while hidden.
                            inert={!visible}
                            aria-hidden={visible ? undefined : true}
                        >
                            {area.children}
                        </div>
                    </Fragment>
                );
            })}
        </div>
    );
};
