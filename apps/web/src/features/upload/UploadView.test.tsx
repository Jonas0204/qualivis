import { fireEvent, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { fakeDataTransfer, fileWithRelativePath, unreadableFile } from '../../test/fakeFiles';
import { loadFixture } from '../../test/fixtures';
import { renderWithState } from '../../test/renderWithState';
import { UploadView } from './UploadView';

/** The files of a fixture folder as the browser selects them. */
const fixtureFiles = (fixture: string) =>
    loadFixture(fixture).map(({ path, code }) => fileWithRelativePath(path.slice(1), code));

afterEach(() => {
    vi.restoreAllMocks();
});

describe('UploadView', () => {
    it('shows the upload card with icon and text', () => {
        const { getByText, queryByRole } = renderWithState(<UploadView onFiles={vi.fn()} />);

        expect(getByText('Drag and drop or browse a folder')).toBeTruthy();
        expect(getByText('note_add').getAttribute('aria-hidden')).toBe('true');
        expect(queryByRole('alert')).toBeNull();
    });

    it('shows an error message below the card', () => {
        const { getByRole } = renderWithState(
            <UploadView onFiles={vi.fn()} error="Analysis failed: Unexpected token (3:4)" />
        );

        expect(getByRole('alert').textContent).toBe('Analysis failed: Unexpected token (3:4)');
    });

    it('passes the selected folder on with paths like the legacy app', async () => {
        const onFiles = vi.fn();
        const { user, getByLabelText } = renderWithState(<UploadView onFiles={onFiles} />);
        const input = getByLabelText(/browse a folder/);
        if (!(input instanceof HTMLInputElement)) {
            throw new Error('file input not found');
        }

        expect(input.type).toBe('file');
        expect(input.hasAttribute('webkitdirectory')).toBe(true);

        await user.upload(input, [
            fileWithRelativePath('my-app/package.json', '{}'),
            fileWithRelativePath('my-app/src/App.js', 'const App = 1;'),
            fileWithRelativePath('my-app/src/index.js', 'render(App);'),
        ]);

        await waitFor(() =>
            expect(onFiles).toHaveBeenCalledWith({
                sources: [
                    { path: '/my-app/src/App.js', code: 'const App = 1;' },
                    { path: '/my-app/src/index.js', code: 'render(App);' },
                ],
                configs: [{ path: '/my-app/package.json', code: '{}' }],
            })
        );
    });

    it('logs a read error and passes nothing on', async () => {
        const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);
        const onFiles = vi.fn();
        const { user, getByLabelText } = renderWithState(<UploadView onFiles={onFiles} />);

        await user.upload(getByLabelText(/browse a folder/), [unreadableFile('my-app/src/App.js')]);

        await waitFor(() =>
            expect(consoleError).toHaveBeenCalledWith(
                'Reading files failed:',
                expect.any(DOMException)
            )
        );
        expect(onFiles).not.toHaveBeenCalled();
    });

    it('passes an upload with one package on at once, without asking', async () => {
        const onFiles = vi.fn();
        const { user, getByLabelText, queryByRole } = renderWithState(
            <UploadView onFiles={onFiles} />
        );

        await user.upload(getByLabelText(/browse a folder/), fixtureFiles('mini'));

        await waitFor(() => expect(onFiles).toHaveBeenCalledTimes(1));
        expect(onFiles.mock.calls[0]).toHaveLength(1);
        expect(queryByRole('combobox', { name: 'App folder' })).toBeNull();
    });

    describe('with the monorepo fixture', () => {
        const uploadMonorepo = async () => {
            const onFiles = vi.fn();
            const rendered = renderWithState(<UploadView onFiles={onFiles} />);
            await rendered.user.upload(
                rendered.getByLabelText(/browse a folder/),
                fixtureFiles('monorepo')
            );
            const combobox = await rendered.findByRole('combobox', { name: 'App folder' });
            return { ...rendered, onFiles, combobox };
        };

        it('asks for the app folder instead of analysing at once', async () => {
            const { user, combobox, getAllByRole, queryByText, onFiles } = await uploadMonorepo();

            expect(queryByText('Drag and drop or browse a folder')).toBeNull();
            expect(combobox.textContent).toBe('Whole project');
            await user.click(combobox);
            expect(getAllByRole('option').map(option => option.textContent)).toEqual([
                'Whole project',
                'web-a (/monorepo/apps/web-a)',
                'web-b (/monorepo/apps/web-b)',
                '@demo/tokens (/monorepo/shared/tokens)',
                '@demo/ui (/monorepo/shared/ui)',
            ]);
            expect(onFiles).not.toHaveBeenCalled();
        });

        it('passes the upload on with the chosen app folder', async () => {
            const { user, combobox, getByRole, onFiles } = await uploadMonorepo();

            await user.click(combobox);
            await user.click(getByRole('option', { name: 'web-a (/monorepo/apps/web-a)' }));
            await user.click(getByRole('button', { name: 'Analyze' }));

            expect(onFiles).toHaveBeenCalledTimes(1);
            const [project, appDir] = onFiles.mock.calls[0] ?? [];
            expect(appDir).toBe('/monorepo/apps/web-a');
            expect(project.sources).toContainEqual(
                expect.objectContaining({ path: '/monorepo/apps/web-a/src/main.tsx' })
            );
        });

        it('passes the upload on without an app folder for "Whole project"', async () => {
            const { user, getByRole, onFiles } = await uploadMonorepo();

            await user.click(getByRole('button', { name: 'Analyze' }));

            expect(onFiles).toHaveBeenCalledTimes(1);
            expect(onFiles.mock.calls[0]).toHaveLength(1);
        });

        it('shows the upload card again on Cancel', async () => {
            const { user, getByRole, getByText, onFiles } = await uploadMonorepo();

            await user.click(getByRole('button', { name: 'Cancel' }));

            expect(getByText('Drag and drop or browse a folder')).toBeTruthy();
            expect(onFiles).not.toHaveBeenCalled();
        });
    });

    it('marks the card while dragging and clears it on drop', () => {
        const { getByText } = renderWithState(<UploadView onFiles={vi.fn()} />);
        const card = getByText('Drag and drop or browse a folder').closest('label')?.parentElement;
        if (!card) {
            throw new Error('upload card not found');
        }

        fireEvent.dragEnter(card);
        expect(card.classList.contains('is-dragging-over')).toBe(true);

        fireEvent.drop(card, { dataTransfer: fakeDataTransfer([]) });
        expect(card.classList.contains('is-dragging-over')).toBe(false);
    });
});
