import { type ComponentProps, useState } from 'react';
import { cx } from '../../lib/cx';
import '../../lib/toggle.css';

type ToggleProps = Omit<ComponentProps<'button'>, 'onChange'> & {
    /** Controlled state; or `defaultPressed` for an uncontrolled toggle. */
    pressed?: boolean;
    defaultPressed?: boolean;
    onPressedChange?: (pressed: boolean) => void;
    variant?: 'ghost' | 'outline';
};

/** Button that stays pressed (aria-pressed), e.g. "bold" or "show clusters". */
export const Toggle = ({
    pressed,
    defaultPressed = false,
    onPressedChange,
    variant = 'ghost',
    className,
    onClick,
    ...props
}: ToggleProps) => {
    const [ownPressed, setOwnPressed] = useState(defaultPressed);
    const current = pressed ?? ownPressed;
    return (
        <button
            type="button"
            {...props}
            aria-pressed={current}
            className={cx('cc-toggle', className)}
            data-variant={variant}
            onClick={event => {
                onClick?.(event);
                setOwnPressed(!current);
                onPressedChange?.(!current);
            }}
        />
    );
};
