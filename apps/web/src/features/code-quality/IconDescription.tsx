import type { VisualIcon } from '@qualivis/core';
import styles from './IconDescription.module.css';

type IconDescriptionProps = { icon: VisualIcon };

/**
 * A hint for an icon of the node (legacy icon-description component): the icon in the colour of
 * its class and the text, with the link as "text (see <a>href</a>)". The legacy app set the text as
 * HTML; here it is text and a real link (ADR-011 A3).
 */
export const IconDescription = ({ icon }: IconDescriptionProps) => {
    const { text, link } = icon.description;
    return (
        <div className={`${styles.container} ${styles[icon.class]}`} data-class={icon.class}>
            <span className={styles.icon} aria-hidden="true">
                {icon.icon}
            </span>
            <span className={styles.description}>
                {text}
                {link && (
                    <>
                        {' (see '}
                        <a href={link.href} target="_blank" rel="noopener noreferrer">
                            {link.href}
                        </a>
                        {')'}
                    </>
                )}
            </span>
        </div>
    );
};
