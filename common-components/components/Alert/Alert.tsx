import type { ReactNode } from 'react';
import { Icon } from '../Icon/Icon';
import './Alert.css';

const icons = { info: 'info', success: 'check_circle', warning: 'warning', danger: 'error' };

type AlertProps = {
    variant?: 'info' | 'success' | 'warning' | 'danger';
    /** Material icon name instead of the icon of the variant. */
    icon?: string;
    title?: ReactNode;
    children?: ReactNode;
    /** Announces the alert when it appears (role "alert" for danger, else "status"). */
    live?: boolean;
};

/** A message inside the page, e.g. about an error or a finished task. */
export const Alert = ({ variant = 'info', icon, title, children, live = false }: AlertProps) => {
    const role = variant === 'danger' ? 'alert' : 'status';
    return (
        <div className="cc-alert" data-variant={variant} role={live ? role : undefined}>
            <Icon name={icon ?? icons[variant]} />
            <div>
                {title !== undefined && <p className="cc-alert__title">{title}</p>}
                {children !== undefined && <div className="cc-alert__body">{children}</div>}
            </div>
        </div>
    );
};
