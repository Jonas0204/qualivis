import './Separator.css';

type SeparatorProps = {
    /** `vertical` for a line between items in a row. */
    orientation?: 'horizontal' | 'vertical';
};

/** Thin line between groups of content. */
export const Separator = ({ orientation = 'horizontal' }: SeparatorProps) => (
    <>
        <hr className="cc-separator" aria-orientation={orientation} />
    </>
);
