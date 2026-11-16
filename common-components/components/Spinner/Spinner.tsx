import './Spinner.css';

type SpinnerProps = {
    /** Size in px (default 18). */
    size?: number;
    /** Read by screen readers. */
    label?: string;
};

/** Small turning ring for work without known progress. */
export const Spinner = ({ size = 18, label = 'Loading' }: SpinnerProps) => (
    <>
        <span
            className="cc-spinner"
            role="status"
            aria-label={label}
            style={{ width: size, height: size }}
        />
    </>
);
