import { describe, expect, it } from 'vitest';
import { renderWithState } from '../test/renderWithState';
import { ProgressBar } from './ProgressBar';

describe('ProgressBar', () => {
  it('exposes the value as a progressbar from 0 to 100', () => {
    const { getByRole } = renderWithState(<ProgressBar value={42} />);

    const bar = getByRole('progressbar');
    expect(bar.getAttribute('aria-valuenow')).toBe('42');
    expect(bar.getAttribute('aria-valuemin')).toBe('0');
    expect(bar.getAttribute('aria-valuemax')).toBe('100');
  });

  it('fills the bar to the value in percent', () => {
    const { getByRole } = renderWithState(<ProgressBar value={37.5} />);

    const fill = getByRole('progressbar').firstElementChild;
    expect(fill instanceof HTMLElement && fill.style.width).toBe('37.5%');
  });
});
