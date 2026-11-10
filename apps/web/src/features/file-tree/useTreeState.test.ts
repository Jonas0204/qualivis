import { extractFileTree, type FileMap } from '@qualivis/core';
import { act, renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { useTreeState } from './useTreeState';

const file = { code: '' };
const fileMap: FileMap = {
    '/app/src/b.js': file,
    '/app/src/A.js': file,
    '/app/src/deep/nested/C.js': file,
    '/app/index.js': file,
    '/lib/src/D.js': file,
};

const visible = (rows: ReturnType<typeof useTreeState>['rows']) =>
    rows.map(row => `${'  '.repeat(row.level)}${row.node.name}${row.expanded ? '/' : ''}`);

describe('useTreeState', () => {
    it('starts with the folders of levels 0 and 1 expanded, folders before files (F1, F2)', () => {
        const tree = extractFileTree(fileMap);
        const { result } = renderHook(() => useTreeState(tree));

        expect(visible(result.current.rows)).toEqual([
            'app/',
            '  src/',
            '    deep',
            '    A.js',
            '    b.js',
            '  index.js',
            'lib/',
            '  src/',
            '    D.js',
        ]);
        expect(result.current.rows[2]).toMatchObject({
            path: '/app/src/deep',
            level: 2,
            expandable: true,
            expanded: false,
        });
        expect(result.current.rows[3]).toMatchObject({ path: '/app/src/A.js', expandable: false });
    });

    it('toggles, expands and collapses a folder by its path', () => {
        const tree = extractFileTree(fileMap);
        const { result } = renderHook(() => useTreeState(tree));

        act(() => result.current.toggle('/app'));
        expect(visible(result.current.rows)).toEqual(['app', 'lib/', '  src/', '    D.js']);

        act(() => result.current.expand('/app'));
        act(() => result.current.collapse('/lib/src'));
        expect(visible(result.current.rows).slice(-2)).toEqual(['lib/', '  src']);
    });

    it('expands the folders of a file, only on its own path (F7)', () => {
        const tree = extractFileTree({ ...fileMap, '/lib/src/deep/E.js': file });
        const { result } = renderHook(() => useTreeState(tree));

        act(() => result.current.expandToFile('/app/src/deep/nested/C.js'));

        expect(visible(result.current.rows)).toContain('        C.js');
        // /lib/src/deep has the same name on the same level, but stays closed.
        expect(result.current.rows.find(row => row.path === '/lib/src/deep')?.expanded).toBe(false);
    });

    it('starts again from levels 0 and 1 for a new tree', () => {
        const { result, rerender } = renderHook(({ tree }) => useTreeState(tree), {
            initialProps: { tree: extractFileTree(fileMap) },
        });
        act(() => result.current.toggle('/app'));

        rerender({ tree: extractFileTree({ '/x/y/z/F.js': file }) });

        expect(visible(result.current.rows)).toEqual(['x/', '  y/', '    z']);
    });
});
