import { useState } from 'react';
import './Avatar.css';

/** First letters of the first and last word, e.g. "Ada Lovelace" → "AL". */
const initialsOf = (name: string) => {
    const words = name.trim().split(/\s+/);
    const first = words[0]?.[0] ?? '';
    const last = words.length > 1 ? (words.at(-1)?.[0] ?? '') : '';
    return (first + last).toUpperCase();
};

type AvatarProps = {
    /** Used for the image's alt text and for the initials. */
    name: string;
    src?: string;
    /** Size in px (default 36). */
    size?: number;
    shape?: 'circle' | 'square';
};

/** Picture of a person or project; shows initials without a picture or when it fails to load. */
export const Avatar = ({ name, src, size = 36, shape = 'circle' }: AvatarProps) => {
    const [failedSrc, setFailedSrc] = useState<string>();
    const showImage = src !== undefined && src !== failedSrc;
    return (
        <span
            className="cc-avatar"
            data-shape={shape}
            style={{ width: size, height: size, fontSize: size * 0.38 }}
        >
            {showImage ? (
                <img src={src} alt={name} onError={() => setFailedSrc(src)} />
            ) : (
                <>
                    <span aria-hidden="true">{initialsOf(name)}</span>
                    <span className="cc-avatar__name">{name}</span>
                </>
            )}
        </span>
    );
};
