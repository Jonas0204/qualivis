import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Icon } from './Icon';

describe('Icon', () => {
  it('renders the ligature name as text and hides it from screen readers', () => {
    render(<Icon name="settings" />);

    const icon = screen.getByText('settings');
    expect(icon.getAttribute('aria-hidden')).toBe('true');
    expect(icon.style.fontSize).toBe('');
  });

  it('uses the given size in px and keeps an extra class', () => {
    render(<Icon name="warning" size={20} className="extra" />);

    const icon = screen.getByText('warning');
    expect(icon.style.fontSize).toBe('20px');
    expect(icon.classList.contains('extra')).toBe(true);
  });
});
