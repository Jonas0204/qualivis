import { fireEvent, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { fakeDataTransfer, fileWithRelativePath, unreadableFile } from '../../test/fakeFiles';
import { renderWithState } from '../../test/renderWithState';
import { UploadView } from './UploadView';

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
            fileWithRelativePath('my-app/src/App.js', 'const App = 1;'),
            fileWithRelativePath('my-app/src/index.js', 'render(App);'),
        ]);

        await waitFor(() =>
            expect(onFiles).toHaveBeenCalledWith([
                { path: '/my-app/src/App.js', code: 'const App = 1;' },
                { path: '/my-app/src/index.js', code: 'render(App);' },
            ])
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
