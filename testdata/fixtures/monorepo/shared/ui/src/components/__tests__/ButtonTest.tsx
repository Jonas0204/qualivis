import type { ReactNode } from 'react';
import { render } from '@testing-library/react';
import { it } from 'vitest';
import { Button } from '../button/Button';

function ButtonWrapper({ children }: { children: ReactNode }) {
  return <div className="test-root">{children}</div>;
}

it('renders the label', () => {
  render(<Button label="Save" />, { wrapper: ButtonWrapper });
});
