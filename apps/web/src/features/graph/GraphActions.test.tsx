import type { View } from '@qualivis/core';
import { fireEvent, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { renderWithState } from '../../test/renderWithState';
import { GraphActions, sizeMetricOptions } from './GraphActions';

type Overrides = Partial<{
    onBack: () => void;
    hasCluster: boolean;
    showCluster: boolean;
    fullScreen: boolean;
    zoomLevel: number;
}>;

const draw = (view: View, overrides: Overrides = {}) => {
    const callbacks = {
        onToggleCluster: vi.fn(),
        onSizeMetricChange: vi.fn(),
        onZoomTo100: vi.fn(),
        onZoomToFit: vi.fn(),
        onToggleFullScreen: vi.fn(),
    };
    const rendered = renderWithState(
        <GraphActions
            view={view}
            onBack={overrides.onBack}
            cluster={{
                hasCluster: overrides.hasCluster ?? true,
                show: overrides.showCluster ?? false,
                onToggle: callbacks.onToggleCluster,
            }}
            sizeMetric={{ value: 'sloc.physical', onChange: callbacks.onSizeMetricChange }}
            zoom={{
                level: overrides.zoomLevel ?? 50,
                onZoomTo100: callbacks.onZoomTo100,
                onZoomToFit: callbacks.onZoomToFit,
            }}
            fullScreen={{
                on: overrides.fullScreen ?? false,
                onToggle: callbacks.onToggleFullScreen,
            }}
        />
    );
    // Queries in this render only: a test may draw several times.
    return { ...within(rendered.container), ...callbacks };
};

const tooltipOf = (element: HTMLElement) =>
    document.getElementById(element.getAttribute('aria-describedby') ?? '')?.textContent;

describe('sizeMetricOptions', () => {
    it('offers all 7 metrics in the app view and none of the component-only ones in the component view', () => {
        expect(sizeMetricOptions('app').map(option => option.label)).toEqual([
            'Lines of Code',
            'Lines of JSX Code',
            'Maximum JSX nesting',
            'Cyclomatic Complexity',
            'Halstead Difficulty',
            'Halstead Bugs',
            'Parameter Count',
        ]);
        expect(sizeMetricOptions('component').map(option => option.value)).toEqual(
            sizeMetricOptions('app')
                .map(option => option.value)
                .filter(value => value !== 'sloc.jsx' && value !== 'maxJsxNesting')
        );
    });
});

describe('GraphActions', () => {
    it('lists the metrics of the view and reports another one', () => {
        const { getByRole, getAllByRole, onSizeMetricChange } = draw('component');
        const select = getByRole('combobox', { name: 'Node size metric' });

        expect(select.textContent).toBe('Lines of Code');
        expect(tooltipOf(select)).toBe('Node size metric');
        fireEvent.click(select);
        expect(getAllByRole('option')).toHaveLength(5);
        fireEvent.click(getByRole('option', { name: 'Cyclomatic Complexity' }));
        expect(onSizeMetricChange).toHaveBeenCalledWith('cyclomatic');
    });

    it('shows the back button only in the component view', () => {
        const onBack = vi.fn();
        const { getByRole } = draw('component', { onBack });

        const back = getByRole('button', { name: 'Back to app graph' });
        expect(tooltipOf(back)).toBe('Back to app graph');
        fireEvent.click(back);
        expect(onBack).toHaveBeenCalledTimes(1);

        expect(
            draw('app', { onBack }).queryByRole('button', { name: 'Back to app graph' })
        ).toBeNull();
        expect(draw('component').queryByRole('button', { name: 'Back to app graph' })).toBeNull();
    });

    it('shows the cluster button only in the component view with clusters', () => {
        const { getByRole, onToggleCluster } = draw('component', { showCluster: true });

        const cluster = getByRole('button', { name: 'Toggle cluster' });
        expect(cluster.className).toMatch(/\bshow-cluster-button on\b/);
        expect(cluster.getAttribute('aria-pressed')).toBe('true');
        fireEvent.click(cluster);
        expect(onToggleCluster).toHaveBeenCalledTimes(1);

        expect(
            draw('component', { hasCluster: false }).queryByRole('button', {
                name: 'Toggle cluster',
            })
        ).toBeNull();
        expect(draw('app').queryByRole('button', { name: 'Toggle cluster' })).toBeNull();
    });

    it('zooms to 100 % and to fit with labels and tooltips of the legacy app', () => {
        const { getByRole, onZoomTo100, onZoomToFit } = draw('app');

        const zoom = getByRole('button', { name: 'Zoom to 100%' });
        expect(zoom.textContent).toBe('50%');
        expect(tooltipOf(zoom)).toBe('Zoom to 100%');
        fireEvent.click(zoom);
        expect(onZoomTo100).toHaveBeenCalledTimes(1);

        const fit = getByRole('button', { name: 'Zoom to fit' });
        expect(tooltipOf(fit)).toBe('Zoom to fit');
        fireEvent.click(fit);
        expect(onZoomToFit).toHaveBeenCalledTimes(1);
    });

    it('shows 100 % for a zoom level of 0, as the legacy app did', () => {
        expect(
            draw('app', { zoomLevel: 0 }).getByRole('button', { name: 'Zoom to 100%' }).textContent
        ).toBe('100%');
    });

    it('toggles full screen with icon and tooltip of the state', () => {
        const { getByRole, onToggleFullScreen } = draw('app');
        const enter = getByRole('button', { name: 'Toggle fullscreen' });

        expect(enter.textContent).toBe('fullscreen');
        expect(tooltipOf(enter)).toBe('Enter fullscreen');
        fireEvent.click(enter);
        expect(onToggleFullScreen).toHaveBeenCalledTimes(1);

        const exit = draw('app', { fullScreen: true }).getByRole('button', {
            name: 'Toggle fullscreen',
        });
        expect(exit.textContent).toBe('fullscreen_exit');
        expect(tooltipOf(exit)).toBe('Exit fullscreen');
    });
});
