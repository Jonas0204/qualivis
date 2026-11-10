import type { ReactNode } from 'react';
import { render } from '@testing-library/react';
import { it } from 'vitest';
import { Page } from '../page/Page';

function PageWrapper({ children }: { children: ReactNode }) {
  return <div className="test-root">{children}</div>;
}

it('shows the title', () => {
  render(<Page title="Test" />, { wrapper: PageWrapper });
});
