import { qualityMetrics, type View } from '@qualivis/core';
import { Button } from '../../ui/Button';
import { Icon } from '../../ui/Icon';
import { IconButton } from '../../ui/IconButton';
import { Select, type SelectOption } from '../../ui/Select';
import { Tooltip } from '../../ui/Tooltip';

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
    /** G15: the cluster button is shown in the component view when the graph has clusters. */
    cluster: { hasCluster: boolean; show: boolean; onToggle: () => void };
    sizeMetric: { value: string; onChange: (metric: string) => void };
    /** G11, G12: zoom level in percent. */
    zoom: { level: number; onZoomTo100: () => void; onZoomToFit: () => void };
    /** G13. */
    fullScreen: { on: boolean; onToggle: () => void };
};

/** Value colour of the select, as the legacy graph sets it (graph.component.scss:157-160). */
const graphButtonColor = 'var(--qv-graph-button)';

/**
 * Action bars above the graph (legacy graph.component.html:165-218): back on the left; cluster,
 * size metric, zoom and full screen on the right.
 */
export const GraphActions = ({
    view,
    onBack,
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
                        <IconButton aria-label="Back to app graph" onClick={onBack}>
                            <Icon name="arrow_back" />
                        </IconButton>
                    </Tooltip>
                )}
            </div>
            <div className="qv-graph-actions right">
                {component && cluster.hasCluster && (
                    <Button
                        variant="stroked"
                        className={cluster.show ? 'show-cluster-button on' : 'show-cluster-button'}
                        aria-pressed={cluster.show}
                        onClick={cluster.onToggle}
                    >
                        Toggle cluster
                    </Button>
                )}
                <Tooltip text="Node size metric">
                    <Select
                        aria-label="Node size metric"
                        value={sizeMetric.value}
                        options={sizeMetricOptions(view)}
                        onChange={sizeMetric.onChange}
                        color={graphButtonColor}
                    />
                </Tooltip>
                <Tooltip text="Zoom to 100%">
                    <Button aria-label="Zoom to 100%" onClick={zoom.onZoomTo100}>
                        {zoom.level || 100}%
                    </Button>
                </Tooltip>
                <Tooltip text="Zoom to fit">
                    <IconButton aria-label="Zoom to fit" onClick={zoom.onZoomToFit}>
                        <Icon name="all_out" />
                    </IconButton>
                </Tooltip>
                <Tooltip text={fullScreenText}>
                    <IconButton aria-label="Toggle fullscreen" onClick={fullScreen.onToggle}>
                        <Icon name={fullScreen.on ? 'fullscreen_exit' : 'fullscreen'} />
                    </IconButton>
                </Tooltip>
            </div>
        </>
    );
};
