import {
    type AnalysisResult,
    type Component,
    type FileMap,
    type Graph,
    hasSingleComponent,
    type View,
} from '@qualivis/core';

/** The graph of a view as the analysis has it (no copy) and the view it is shown in. */
export type ViewGraph = { graph: Graph; view: View };

/** The component `<file>#<component>`; own keys only, so URL ids like `#constructor` find nothing. */
export const findComponent = (fileMap: FileMap, componentId: string): Component | undefined => {
    const [fileName = '', componentName = ''] = componentId.split('#');
    const components = Object.hasOwn(fileMap, fileName) ? fileMap[fileName]?.components : undefined;
    return components && Object.hasOwn(components, componentName)
        ? components[componentName]
        : undefined;
};

/**
 * The graph that data.service.ts setComponentGraph (lines 93-115) shows, and its view: the component
 * graph for `componentId`, the only component's graph, or the app graph. An unknown componentId
 * shows the app graph as app view (useUrlState also removes it from the URL). The legacy app
 * showed the app graph too, but counted it as component view (graph.component.ts:120), so the
 * component view rules applied.
 */
export const selectViewGraph = (
    { fileMap, appGraph }: AnalysisResult,
    componentId: string | undefined
): ViewGraph | undefined => {
    const component = componentId ? findComponent(fileMap, componentId) : undefined;
    if (component) {
        return component.graph ? { graph: component.graph, view: 'component' } : undefined;
    }
    // if only one component show its graph instead of the app graph
    if (hasSingleComponent(fileMap)) {
        const graph = Object.values(Object.values(fileMap)[0]?.components ?? {})[0]?.graph;
        return graph ? { graph, view: 'component' } : undefined;
    }
    return { graph: appGraph, view: 'app' };
};
