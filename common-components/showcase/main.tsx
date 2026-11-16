import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
// Roboto and Material Icons, served locally by the web app's font packages.
import '../../apps/web/src/styles/fonts.css';
import '../theme.css';
import './showcase.css';
import { applyColorMode, colorModeFromUrl } from './colorModes';
import { Showcase } from './Showcase';

const rootElement = document.getElementById('root');
if (!rootElement) {
    throw new Error('Missing #root element in index.html');
}

// Set before the first render, so the page does not start in the other mode and fade over.
applyColorMode(colorModeFromUrl());

createRoot(rootElement).render(
    <StrictMode>
        <Showcase />
    </StrictMode>
);
