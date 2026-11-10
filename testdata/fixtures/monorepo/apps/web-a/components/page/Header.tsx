import { Button } from '@demo/ui/components/button/Button';
import { headerStyle } from './Header.styles';

type HeaderProps = { title: string };

export function Header({ title }: HeaderProps) {
  return (
    <header style={headerStyle}>
      <h1>{title}</h1>
      <Button label="Menu" />
    </header>
  );
}
