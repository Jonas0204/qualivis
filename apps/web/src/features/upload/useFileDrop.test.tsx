import type { SourceFile } from '@qualivis/core';
import { fireEvent, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { entryItem, fakeDataTransfer, fakeFileEntry } from '../../test/fakeFiles';
import { renderWithState } from '../../test/renderWithState';
import { useFileDrop } from './useFileDrop';

type DropProbeProps = { onFiles: (files: SourceFile[]) => void };

const DropProbe = ({ onFiles }: DropProbeProps) => {
  const { isDraggingOver, handlers } = useFileDrop(onFiles);
  return (
    <div data-testid="target" {...handlers}>
      <span>child</span>
      <output>{isDraggingOver ? 'over' : 'idle'}</output>
    </div>
  );
};

describe('useFileDrop', () => {
  it('marks dragging on dragenter and ignores dragleave from child elements', () => {
    const { getByTestId, getByText, getByRole } = renderWithState(<DropProbe onFiles={vi.fn()} />);

    fireEvent.dragEnter(getByTestId('target'));
    expect(getByRole('status').textContent).toBe('over');

    fireEvent.dragLeave(getByText('child'));
    expect(getByRole('status').textContent).toBe('over');

    fireEvent.dragLeave(getByTestId('target'));
    expect(getByRole('status').textContent).toBe('idle');
  });

  it('reads the dropped files and passes them on', async () => {
    const onFiles = vi.fn();
    const { getByTestId, getByRole } = renderWithState(<DropProbe onFiles={onFiles} />);
    const dataTransfer = fakeDataTransfer([entryItem(fakeFileEntry('/my-app/App.js', 'code'))]);

    fireEvent.dragEnter(getByTestId('target'));
    fireEvent.drop(getByTestId('target'), { dataTransfer });

    expect(getByRole('status').textContent).toBe('idle');
    await waitFor(() =>
      expect(onFiles).toHaveBeenCalledWith([{ path: '/my-app/App.js', code: 'code' }])
    );
  });

  it('does nothing when the drop has no items', async () => {
    const onFiles = vi.fn();
    const { getByTestId } = renderWithState(<DropProbe onFiles={onFiles} />);

    fireEvent.drop(getByTestId('target'), { dataTransfer: fakeDataTransfer([]) });

    await Promise.resolve();
    expect(onFiles).not.toHaveBeenCalled();
  });
});
