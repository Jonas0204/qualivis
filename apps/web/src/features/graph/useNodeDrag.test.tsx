import { fireEvent, render } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { LayoutEngine, LayoutNode } from './layout/types';
import { type NodeDragOptions, useNodeDrag } from './useNodeDrag';

type Probe = { node: LayoutNode; options: NodeDragOptions; onSvgPointerDown: () => void };

const DragProbe = ({ node, options, onSvgPointerDown }: Probe) => {
    const { onPointerDown } = useNodeDrag(options);
    return (
        // biome-ignore lint/a11y/noSvgWithoutTitle: test markup only
        <svg onPointerDown={onSvgPointerDown}>
            <g className="node" onPointerDown={event => onPointerDown(node, event)} />
        </svg>
    );
};

/** Records the drag calls of the engine. */
const fakeEngine = () => {
    const calls: string[] = [];
    const engine = {
        dragStart: node => calls.push(`dragStart ${node.id}`),
        drag: (node, { x, y }) => calls.push(`drag ${node.id} ${x} ${y}`),
        dragEnd: (node, { pin }) => calls.push(`dragEnd ${node.id} ${pin}`),
    } as Pick<LayoutEngine, 'dragStart' | 'drag' | 'dragEnd'> as LayoutEngine;
    return { calls, engine };
};

const setup = (options: Partial<NodeDragOptions> = {}) => {
    const { calls, engine } = fakeEngine();
    const node: LayoutNode = { id: 'a', width: 20, height: 20, x: 5, y: 5 };
    const onDraggingChange = vi.fn();
    const onSvgPointerDown = vi.fn();
    const { container } = render(
        <DragProbe
            node={node}
            onSvgPointerDown={onSvgPointerDown}
            options={{
                getEngine: () => engine,
                // Zoomed in twice and moved by (10, 20); the SVG sits at the top left (jsdom).
                getTransform: () => ({ k: 2, x: 10, y: 20 }),
                onDraggingChange,
                ...options,
            }}
        />
    );
    const group = container.querySelector('g.node');
    if (!group) {
        throw new Error('no node');
    }
    return { calls, group, onDraggingChange, onSvgPointerDown };
};

const down = (group: Element, init: PointerEventInit = {}) =>
    fireEvent.pointerDown(group, { pointerId: 1, clientX: 30, clientY: 60, ...init });
const move = (clientX: number, clientY: number) =>
    fireEvent.pointerMove(window, { pointerId: 1, clientX, clientY });
const up = (init: PointerEventInit = {}) =>
    fireEvent.pointerUp(window, { pointerId: 1, clientX: 70, clientY: 100, ...init });

describe('useNodeDrag', () => {
    // A drag swallows the next click until the next task (suppressNextClick); let that pass.
    afterEach(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
    });

    it('calls dragStart, drag for every move and dragEnd, keeping the offset to the pointer', () => {
        const { calls, group, onDraggingChange } = setup();

        // Pointer (30, 60) is graph point (10, 20); the node at (5, 5) keeps the offset (-5, -15).
        down(group);
        move(50, 100);
        move(70, 100);
        up();

        expect(calls).toEqual(['dragStart a', 'drag a 15 25', 'drag a 25 25', 'dragEnd a false']);
        expect(onDraggingChange.mock.calls).toEqual([[true], [false]]);
    });

    it('pins the node when Shift is held on release, not on cancel', () => {
        const pinned = setup();
        down(pinned.group);
        move(50, 100);
        up({ shiftKey: true });
        expect(pinned.calls.at(-1)).toBe('dragEnd a true');

        const cancelled = setup();
        down(cancelled.group);
        move(50, 100);
        fireEvent.pointerCancel(window, { pointerId: 1, shiftKey: true });
        expect(cancelled.calls.at(-1)).toBe('dragEnd a false');
    });

    it('treats a pointer down without a move as a click', () => {
        const { calls, group, onDraggingChange } = setup();
        const onClick = vi.fn();
        group.addEventListener('click', onClick);

        down(group);
        move(30, 60);
        up({ clientX: 30, clientY: 60 });
        fireEvent.click(group);

        expect(calls).toEqual([]);
        expect(onDraggingChange).not.toHaveBeenCalled();
        expect(onClick).toHaveBeenCalledTimes(1);
    });

    it('swallows the click after a drag', () => {
        const { group } = setup();
        const onClick = vi.fn();
        group.addEventListener('click', onClick);

        down(group);
        move(50, 100);
        up();
        fireEvent.click(group);

        expect(onClick).not.toHaveBeenCalled();
    });

    it('keeps the pointer down from reaching the background, so it does not pan', () => {
        const { group, onSvgPointerDown } = setup();

        down(group);
        up();

        expect(onSvgPointerDown).not.toHaveBeenCalled();
    });

    it('ignores other buttons and Ctrl and lets the pointer down through', () => {
        const { calls, group, onSvgPointerDown } = setup();

        down(group, { button: 2 });
        move(50, 100);
        up();
        down(group, { ctrlKey: true });
        move(50, 100);
        up();

        expect(calls).toEqual([]);
        expect(onSvgPointerDown).toHaveBeenCalledTimes(2);
    });

    it('does nothing without a running engine', () => {
        const { group, onDraggingChange } = setup({ getEngine: () => undefined });

        down(group);
        move(50, 100);
        up();

        expect(onDraggingChange).not.toHaveBeenCalled();
    });
});
