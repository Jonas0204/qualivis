import { memo } from 'react';
import { Card } from '@demo/ui/components/card/Card';
import type { Size } from '@demo/ui/types';
import { Header } from './Header';

type PageProps = { title: string; size?: Size };

export const Page = memo(function Page({ title, size }: PageProps) {
  return (
    <main>
      <Header title={title} />
      <Card size={size}>Welcome</Card>
    </main>
  );
});
