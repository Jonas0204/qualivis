import { qualityMetrics, type View } from '@qualivis/core';
import {
    Button,
    Icon,
    Select,
    type SelectOption,
    Toggle,
    Tooltip,
} from '../../../../../common-components';

/**
 * Size metrics of the select (G14): all in the app view, without the component-only ones in the
 * component view (N11).
 */
export const sizeMetricOptions = (view: View): SelectOption[] =>
    Object.entries(qualityMetrics)
        .filter(([, metric]) => view === 'app' || !metric.componentOnly)
        .map(([value, metric]) => ({ value, label: metric.name }));

type GraphActionsProps = {
    view: View;
    /** N13: shown in the component view when given. */
    onBack?: () => void;
    /** Stop button, shown while the layout runs (not in the legacy app, P08-S09). */
    layout: { running: boolean; onStop: () => void };
    /** G15: the cluster button is shown in the component view when the graph has clusters. */
    cluster: { hasCluster: boolean; show: boolean; onToggle: () => void };
    sizeMetric: { value: string; onChange: (metric: string) => void };
    /** G11, G12: zoom level in percent. */
    zoom: { level: number; onZoomTo100: () => void; onZoomToFit: () => void };
    /** G13. */
    fullScreen: { on: boolean; onToggle: () => void };
};

/**
 * Action bars above the graph (legacy graph.component.html:165-218): back and stopping the layout
 * on the left; cluster, size metric, zoom and full screen on the right.
 */
export const GraphActions = ({
    view,
    onBack,
    layout,
    cluster,
    sizeMetric,
    zoom,
    fullScreen,
}: GraphActionsProps) => {
    const component = view === 'component';
    const fullScreenText = fullScreen.on ? 'Exit fullscreen' : 'Enter fullscreen';

    return (
        <>
            <div className="qv-graph-actions left">
                {component && onBack && (
                    <Tooltip text="Back to app graph">
                        <Button size="icon" aria-label="Back to app graph" onClick={onBack}>
                            <Icon name="arrow_back" />
                        </Button>
                    </Tooltip>
                )}
                {layout.running && (
                    <Tooltip text="Stop layout">
                        <Button size="icon" aria-label="Stop layout" onClick={layout.onStop}>
                            <Icon name="stop" />
                        </Button>
                    </Tooltip>
                )}
            </div>
            <div className="qv-graph-actions right">
                {component && cluster.hasCluster && (
                    <Toggle
                        variant="outline"
                        className="show-cluster-button"
                        pressed={cluster.show}
                        onPressedChange={cluster.onToggle}
                    >
                        Toggle cluster
                    </Toggle>
                )}
                <Tooltip text="Node size metric">
                    <Select
                        aria-label="Node size metric"
                        value={sizeMetric.value}
                        className="size-metric"
                        options={sizeMetricOptions(view)}
                        onChange={event => sizeMetric.onChange(event.currentTarget.value)}
                    />
                </Tooltip>
                <Tooltip text="Zoom to 100%">
                    <Button aria-label="Zoom to 100%" onClick={zoom.onZoomTo100}>
                        {zoom.level || 100}%
                    </Button>
                </Tooltip>
                <Tooltip text="Zoom to fit">
                    <Button size="icon" aria-label="Zoom to fit" onClick={zoom.onZoomToFit}>
                        <Icon name="all_out" />
                    </Button>
                </Tooltip>
                <Tooltip text={fullScreenText}>
                    <Button
                        size="icon"
                        aria-label="Toggle fullscreen"
                        onClick={fullScreen.onToggle}
                    >
                        <Icon name={fullScreen.on ? 'fullscreen_exit' : 'fullscreen'} />
                    </Button>
                </Tooltip>
            </div>
        </>
    );
};
