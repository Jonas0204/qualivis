import { forwardRef, type ReactNode } from 'react';
import type { Size } from '../../types';
import { Icon } from '../icon/Icon';

type CardProps = { size?: Size; children: ReactNode };

export const Card = forwardRef<HTMLDivElement, CardProps>(({ size, children }, ref) => (
  <div ref={ref} className={`card card-${size ?? 'medium'}`}>
    <Icon />
    {children}
  </div>
));
