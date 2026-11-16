import { type ComponentProps, type ReactNode, useId } from 'react';
import { cx } from '../../lib/cx';
import './Card.css';

type CardProps = Omit<ComponentProps<'section'>, 'title'> & {
    title?: ReactNode;
    description?: ReactNode;
    /** Shown on the right of the title, e.g. a menu button. */
    actions?: ReactNode;
    /** Bottom bar, e.g. buttons. */
    footer?: ReactNode;
};

/** Framed section with an optional title, description, actions and footer. */
export const Card = ({
    title,
    description,
    actions,
    footer,
    className,
    children,
    ...props
}: CardProps) => {
    const titleId = useId();
    const hasHeader = title !== undefined || description !== undefined || actions !== undefined;
    return (
        <section
            aria-labelledby={title === undefined ? undefined : titleId}
            {...props}
            className={cx('cc-card', className)}
        >
            {hasHeader && (
                <div className="cc-card__header">
                    <div className="cc-card__heading">
                        {title !== undefined && (
                            <h3 id={titleId} className="cc-card__title">
                                {title}
                            </h3>
                        )}
                        {description !== undefined && (
                            <p className="cc-card__description">{description}</p>
                        )}
                    </div>
                    {actions}
                </div>
            )}
            <div className="cc-card__content">{children}</div>
            {footer !== undefined && <div className="cc-card__footer">{footer}</div>}
        </section>
    );
};
