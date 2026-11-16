import type { ComponentProps } from 'react';
import { cx } from '../../lib/cx';
import './Label.css';

/** Label of a form control; link it with `htmlFor`. */
export const Label = ({ className, ...props }: ComponentProps<'label'>) => (
    <>
        {/* biome-ignore lint/a11y/noLabelWithoutControl: the caller passes htmlFor or a control */}
        <label {...props} className={cx('cc-label', className)} />
    </>
);
