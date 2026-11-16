export type ColorMode = { id: string; name: string; summary: string };

/** The modes of ../theme.css; "system" sets nothing and follows the operating system. */
export const colorModes: readonly ColorMode[] = [
    { id: 'system', name: 'System', summary: 'Follows the setting of the operating system.' },
    { id: 'light', name: 'Light', summary: 'Petrol accent on a light grey page.' },
    { id: 'dark', name: 'Dark', summary: 'The same design on dark graphite.' },
];

/** The mode from `?mode=…`, else "system". */
export const colorModeFromUrl = () => {
    const id = new URLSearchParams(window.location.search).get('mode');
    return colorModes.find(mode => mode.id === id)?.id ?? 'system';
};

/** Fixes the mode for the whole page, or lets it follow the system again. */
export const applyColorMode = (id: string) => {
    if (id === 'system') {
        delete document.documentElement.dataset.colorScheme;
    } else {
        document.documentElement.dataset.colorScheme = id;
    }
};
