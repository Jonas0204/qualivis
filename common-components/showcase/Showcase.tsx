import { useEffect, useState } from 'react';
import { applyColorMode, colorModeFromUrl, colorModes } from './colorModes';
import { ButtonsSection } from './sections/ButtonsSection';
import { ChoicesSection } from './sections/ChoicesSection';
import { DataSection } from './sections/DataSection';
import { FeedbackSection } from './sections/FeedbackSection';
import { FormSection } from './sections/FormSection';
import { NavigationSection } from './sections/NavigationSection';
import { OverlaySection } from './sections/OverlaySection';

/** Every common component on one page, in the colour mode chosen at the top. */
export const Showcase = () => {
    const [mode, setMode] = useState(colorModeFromUrl);

    // The mode applies to the whole page and is kept in the URL for links and reloads.
    useEffect(() => {
        applyColorMode(mode);
        const url = new URL(window.location.href);
        url.searchParams.set('mode', mode);
        window.history.replaceState(null, '', url);
    }, [mode]);

    return (
        <div className="sc-page">
            <header className="sc-header">
                <div className="sc-intro">
                    <p className="sc-eyebrow">Qualivis</p>
                    <h1 className="sc-title">Common Components</h1>
                    <p className="sc-lead">
                        Base UI components in plain CSS on native elements. Pick light or dark mode;
                        every component below follows it.
                    </p>
                </div>
                <fieldset className="sc-designs">
                    <legend className="sc-hidden">Colour mode</legend>
                    {colorModes.map(item => (
                        // Each card shows its mode in the colours of that mode.
                        <button
                            key={item.id}
                            type="button"
                            aria-pressed={item.id === mode}
                            className="sc-design"
                            data-color-scheme={item.id === 'system' ? undefined : item.id}
                            onClick={() => setMode(item.id)}
                        >
                            <span className="sc-design__swatches" aria-hidden="true">
                                <span style={{ background: 'var(--colorPrimary)' }} />
                                <span style={{ background: 'var(--colorBackground)' }} />
                                <span style={{ background: 'var(--colorText)' }} />
                            </span>
                            <span className="sc-design__name">{item.name}</span>
                            <span className="sc-design__summary">{item.summary}</span>
                        </button>
                    ))}
                </fieldset>
            </header>
            <main className="sc-grid">
                <ButtonsSection />
                <FormSection />
                <ChoicesSection />
                <FeedbackSection />
                <OverlaySection />
                <NavigationSection />
                <DataSection />
            </main>
        </div>
    );
};
