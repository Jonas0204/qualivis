import type { VisualIcon } from '@qualivis/core';
import { Alert } from '../../../../../common-components';

const variantOf = { warn: 'warning', error: 'danger' } as const;

/**
 * A hint for an icon of the node (legacy icon-description component): the icon in the colour of
 * its class and the text, with the link as "text (see <a>href</a>)". The legacy app set the text as
 * HTML; here it is text and a real link (ADR-011 A3).
 */
export const IconDescription = ({ icon }: { icon: VisualIcon }) => {
    const { text, link } = icon.description;
    return (
        <Alert variant={variantOf[icon.class]} icon={icon.icon}>
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
        </Alert>
    );
};
