import { analyzeProject } from '@qualivis/core';
import { act, fireEvent } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { analysisAtom, initialAnalysisState } from '../../state/analysisAtoms';
import { selectionAtom } from '../../state/selectionAtoms';
import { componentIdAtom } from '../../state/viewAtoms';
import { loadFixture } from '../../test/fixtures';
import { renderWithState } from '../../test/renderWithState';
import { initial } from '../../test/TestProvider';
import { FileTree, fileClickDelay } from './FileTree';

const mini = analyzeProject(loadFixture('mini'));
const done = initial(analysisAtom, { ...initialAnalysisState, status: 'done', result: mini });
const app = '/mini/src/App.js#App';
const header = '/mini/src/components/Header.js#Header';

const drawTree = (componentId?: string) =>
    renderWithState(<FileTree />, { initialValues: [done, initial(componentIdAtom, componentId)] });

const rowNames = (container: HTMLElement) =>
    Array.from(container.querySelectorAll('[role="treeitem"]'), row =>
        row.getAttribute('aria-label')?.replace('toggle ', '')
    );

const wait = (ms: number) =>
    act(() => {
        vi.advanceTimersByTime(ms);
    });

describe('FileTree', () => {
    beforeEach(() => {
        vi.useFakeTimers();
        vi.spyOn(console, 'log').mockImplementation(() => {});
        vi.spyOn(console, 'error').mockImplementation(() => {});
    });
    afterEach(() => {
        vi.useRealTimers();
        vi.restoreAllMocks();
    });

    it('shows folders before files with levels 0 and 1 expanded and logs the tree (F1-F3)', () => {
        const { container, getByRole } = drawTree();

        expect(rowNames(container)).toEqual(['mini', 'src', 'base', 'components', 'App.js']);
        const src = getByRole('treeitem', { name: 'toggle src' });
        expect(src.getAttribute('aria-level')).toBe('2');
        expect(src.getAttribute('aria-expanded')).toBe('true');
        expect(src.style.paddingLeft).toBe('28px');
        expect(getByRole('treeitem', { name: 'toggle base' }).getAttribute('aria-expanded')).toBe(
            'false'
        );
        const file = getByRole('treeitem', { name: 'toggle App.js' });
        expect(file.getAttribute('aria-expanded')).toBeNull();
        expect(file.getAttribute('aria-selected')).toBe('false');
        expect(file.textContent).toBe('codeApp.js');
        expect(src.textContent).toBe('foldersrc');
        expect(console.log).toHaveBeenCalledWith('FileTree:', expect.any(Array));
    });

    it('expands and collapses a folder on click (F4)', () => {
        const { container, getByRole } = drawTree();

        fireEvent.click(getByRole('treeitem', { name: 'toggle components' }));
        expect(rowNames(container)).toContain('Header.js');

        fireEvent.click(getByRole('treeitem', { name: 'toggle components' }));
        expect(rowNames(container)).not.toContain('Header.js');
    });

    it('selects a file on click and goes back to the app view after 500 ms (F5)', () => {
        const { getByRole, store } = drawTree(app);
        const file = getByRole('treeitem', { name: 'toggle App.js' });

        fireEvent.click(file);
        expect(store.get(selectionAtom)?.map(each => each.id)).toEqual([app]);
        expect(file.getAttribute('aria-selected')).toBe('true');
        expect(file.className).toMatch(/selected/);

        wait(fileClickDelay - 1);
        expect(store.get(componentIdAtom)).toBe(app);
        // A second click starts the wait again and does not select again.
        fireEvent.click(file);
        wait(fileClickDelay - 1);
        expect(store.get(componentIdAtom)).toBe(app);
        wait(1);
        expect(store.get(componentIdAtom)).toBeUndefined();
        expect(console.log).toHaveBeenCalledWith('Select file -> nodes: ', expect.any(Array));
        expect(
            vi.mocked(console.log).mock.calls.filter(([text]) => text === 'Select file -> nodes: ')
        ).toHaveLength(1);
    });

    it('opens the component view of a file with one component on double click (F6)', () => {
        const { getByRole, store } = drawTree();
        fireEvent.click(getByRole('treeitem', { name: 'toggle components' }));
        const file = getByRole('treeitem', { name: 'toggle Header.js' });

        // A double click is two clicks and a dblclick.
        fireEvent.click(file);
        fireEvent.click(file);
        fireEvent.doubleClick(file);
        wait(fileClickDelay * 2);

        expect(store.get(componentIdAtom)).toBe(header);
    });

    it('does not open a file with several components on double click', () => {
        const { getByRole, store } = drawTree();
        fireEvent.click(getByRole('treeitem', { name: 'toggle components' }));
        const file = getByRole('treeitem', { name: 'toggle TodoList.jsx' });

        fireEvent.click(file);
        fireEvent.doubleClick(file);
        wait(fileClickDelay * 2);

        expect(store.get(componentIdAtom)).toBeUndefined();
        expect(store.get(selectionAtom)).toHaveLength(2);
    });

    it('expands the folders of a node selected in the graph and marks its file (F7)', () => {
        const { getByRole, store } = drawTree();

        act(() =>
            store.set(selectionAtom, [
                { id: header, label: 'Header', type: 'component', report: undefined },
            ])
        );

        const file = getByRole('treeitem', { name: 'toggle Header.js' });
        expect(file.getAttribute('aria-selected')).toBe('true');
        expect(
            getByRole('treeitem', { name: 'toggle components' }).getAttribute('aria-expanded')
        ).toBe('true');
    });

    it('moves the focus with the arrow keys and acts on Enter', () => {
        const { container, getByRole, store } = drawTree();
        const mini = getByRole('treeitem', { name: 'toggle mini' });
        expect(mini.tabIndex).toBe(0);
        expect(getByRole('treeitem', { name: 'toggle src' }).tabIndex).toBe(-1);

        mini.focus();
        fireEvent.keyDown(mini, { key: 'ArrowDown' });
        fireEvent.keyDown(document.activeElement as Element, { key: 'ArrowDown' });
        fireEvent.keyDown(document.activeElement as Element, { key: 'ArrowDown' });
        const components = getByRole('treeitem', { name: 'toggle components' });
        expect(document.activeElement).toBe(components);
        expect(components.tabIndex).toBe(0);

        fireEvent.keyDown(components, { key: 'ArrowRight' });
        expect(rowNames(container)).toContain('Header.js');
        fireEvent.keyDown(components, { key: 'ArrowLeft' });
        expect(rowNames(container)).not.toContain('Header.js');
        fireEvent.keyDown(components, { key: 'Enter' });
        expect(rowNames(container)).toContain('Header.js');

        const app = getByRole('treeitem', { name: 'toggle App.js' });
        fireEvent.keyDown(app, { key: 'Enter' });
        expect(store.get(selectionAtom)?.map(each => each.id)).toEqual(['/mini/src/App.js#App']);
    });
});
