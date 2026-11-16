import { type ReactNode, useId } from 'react';
import { Label } from '../Label/Label';
import './Field.css';

/** Props the field gives its control. */
export type FieldControlProps = {
    id: string;
    'aria-describedby': string | undefined;
    invalid: boolean;
};

type FieldProps = {
    label: ReactNode;
    /** Help text below the control. */
    hint?: ReactNode;
    /** Shown instead of the hint and marks the control as invalid. */
    error?: ReactNode;
    /** Renders the control with the ids that link it to label, hint and error. */
    children: (control: FieldControlProps) => ReactNode;
};

/**
 * Label, control and help or error text, linked for screen readers:
 * `<Field label="Name">{props => <Input {...props} />}</Field>`.
 */
export const Field = ({ label, hint, error, children }: FieldProps) => {
    const id = useId();
    const messageId = `${id}-message`;
    const hasError = error !== undefined && error !== null && error !== false;
    const message = hasError ? error : hint;
    return (
        <div className="cc-field">
            <Label htmlFor={id}>{label}</Label>
            {children({
                id,
                'aria-describedby': message === undefined ? undefined : messageId,
                invalid: hasError,
            })}
            {message !== undefined && (
                <p id={messageId} className={hasError ? 'cc-field__error' : 'cc-field__hint'}>
                    {message}
                </p>
            )}
        </div>
    );
};
