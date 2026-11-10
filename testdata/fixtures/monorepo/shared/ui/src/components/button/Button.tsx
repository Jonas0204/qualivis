import { useToggle } from '../../hooks/useToggle';
import { Icon } from '../icon/Icon';
import { buttonStyle } from './Button.styles';

type ButtonProps = { label: string };

export function Button({ label }: ButtonProps) {
  const [pressed, toggle] = useToggle();
  return (
    <button type="button" style={buttonStyle} aria-pressed={pressed} onClick={toggle}>
      <Icon />
      {label}
    </button>
  );
}
