import { act } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { fullScreenAtom } from '../../state/viewAtoms';
import { renderWithState } from '../../test/renderWithState';
import { GraphPage } from './GraphPage';

const area = (container: HTMLElement, key: string) =>
    container.querySelector<HTMLElement>(`[data-area="${key}"]`);

const drawPage = () =>
    renderWithState(<GraphPage fileTree="Files" codeQuality="Code Quality" sourceCode="Source" />);

describe('GraphPage', () => {
    it('splits the page into 275 px | graph | 575 px, the right column into 363 px | rest', () => {
        const { container, getAllByRole } = drawPage();

        expect(area(container, 'fileTree')?.style.flexBasis).toBe('275px');
        expect(area(container, 'side')?.style.flexBasis).toBe('575px');
        expect(area(container, 'codeQuality')?.style.flexBasis).toBe('363px');
        expect(area(container, 'graph')?.querySelector('.qv-graph-area')).not.toBeNull();
        expect(area(container, 'fileTree')?.textContent).toBe('Files');
        expect(area(container, 'sourceCode')?.textContent).toBe('Source');
        expect(getAllByRole('separator').map(gutter => gutter.getAttribute('aria-label'))).toEqual([
            'Resize file tree',
            'Resize side panels',
            'Resize code quality',
        ]);
    });

    it('hides the side columns in full screen and keeps their panels mounted', () => {
        const { container, queryAllByRole, store } = drawPage();

        act(() => store.set(fullScreenAtom, true));

        expect(queryAllByRole('separator')).toHaveLength(0);
        expect(area(container, 'fileTree')?.style.flexBasis).toBe('');
        expect(area(container, 'side')?.style.flexBasis).toBe('');
        expect(area(container, 'fileTree')?.textContent).toBe('Files');

        act(() => store.set(fullScreenAtom, false));
        expect(queryAllByRole('separator')).toHaveLength(3);
    });
});
