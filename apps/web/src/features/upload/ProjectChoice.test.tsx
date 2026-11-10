import type { WorkspacePackage } from '@qualivis/core';
import { describe, expect, it, vi } from 'vitest';
import { renderWithState } from '../../test/renderWithState';
import { ProjectChoice } from './ProjectChoice';

const candidates: WorkspacePackage[] = [
    { dir: '/r/apps/web', name: 'web', entries: {} },
    { dir: '/r/shared/misc', entries: {} },
];

const draw = () => {
    const onAnalyze = vi.fn();
    const onCancel = vi.fn();
    const rendered = renderWithState(
        <ProjectChoice candidates={candidates} onAnalyze={onAnalyze} onCancel={onCancel} />
    );
    return { ...rendered, onAnalyze, onCancel };
};

describe('ProjectChoice', () => {
    it('asks for the app folder with "Whole project" preselected', () => {
        const { getByRole, getByText } = draw();

        expect(getByRole('heading', { name: 'Which folder is the app?' })).toBeTruthy();
        expect(getByText('Only the files the app uses are analysed.')).toBeTruthy();
        expect(getByRole('combobox', { name: 'App folder' }).textContent).toBe('Whole project');
    });

    it('lists the candidates as name (dir), or the dir without a name', async () => {
        const { user, getByRole, getAllByRole } = draw();

        await user.click(getByRole('combobox', { name: 'App folder' }));

        expect(getAllByRole('option').map(option => option.textContent)).toEqual([
            'Whole project',
            'web (/r/apps/web)',
            '/r/shared/misc',
        ]);
    });

    it('analyses the chosen folder', async () => {
        const { user, getByRole, onAnalyze } = draw();

        await user.click(getByRole('combobox', { name: 'App folder' }));
        await user.click(getByRole('option', { name: 'web (/r/apps/web)' }));
        await user.click(getByRole('button', { name: 'Analyze' }));

        expect(onAnalyze).toHaveBeenCalledWith('/r/apps/web');
    });

    it('analyses the whole project without a choice', async () => {
        const { user, getByRole, onAnalyze } = draw();

        await user.click(getByRole('button', { name: 'Analyze' }));

        expect(onAnalyze).toHaveBeenCalledWith(undefined);
    });

    it('cancels', async () => {
        const { user, getByRole, onAnalyze, onCancel } = draw();

        await user.click(getByRole('button', { name: 'Cancel' }));

        expect(onCancel).toHaveBeenCalledTimes(1);
        expect(onAnalyze).not.toHaveBeenCalled();
    });
});
