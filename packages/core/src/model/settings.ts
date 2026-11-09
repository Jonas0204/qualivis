// Copied from legacy/angular/src/app/interfaces.ts (Settings) and
// legacy/angular/src/app/services/settings.service.ts:9-19 (defaults).
export type Settings = {
    text?: boolean;
    fade?: boolean;
    highlightIndirectNodes?: boolean;
    fullScreen?: boolean;
    colaLayout?: boolean;
    nodeSizesBasedOnMetrics?: boolean;
    autoZoom?: boolean;
    currentSizeMetricErrorHighlighting?: boolean;
    hideOverlappingLabels?: boolean;
};

export const defaultSettings: Settings = {
    text: true,
    fade: true,
    highlightIndirectNodes: true,
    fullScreen: false,
    colaLayout: true,
    nodeSizesBasedOnMetrics: true,
    autoZoom: true,
    currentSizeMetricErrorHighlighting: false,
    hideOverlappingLabels: true,
};
