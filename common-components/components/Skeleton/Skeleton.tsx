import type { CSSProperties } from 'react';
import './Skeleton.css';

type SkeletonProps = {
    width?: CSSProperties['width'];
    height?: CSSProperties['height'];
    shape?: 'rect' | 'circle';
};

/** Placeholder while content loads. Decorative; the loading state is announced elsewhere. */
export const Skeleton = ({ width = '100%', height = 16, shape = 'rect' }: SkeletonProps) => (
    <>
        <span
            className="cc-skeleton"
            data-shape={shape}
            aria-hidden="true"
            style={{ width, height }}
        />
    </>
);
