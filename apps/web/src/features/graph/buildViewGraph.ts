import {
  type AnalysisResult,
  type Component,
  type FileMap,
  type Graph,
  graphSettings,
  hasSingleComponent,
  type Link,
  type Node,
} from '@qualivis/core';

export type View = 'app' | 'component';

export type ViewNode = Node & { width: number; height: number };

export type ViewLink = Omit<Link, 'source' | 'target'> & { source: ViewNode; target: ViewNode };

export type ViewGraph = { nodes: ViewNode[]; links: ViewLink[]; view: View };

/** The component `<file>#<component>`; own keys only, so URL ids like `#constructor` find nothing. */
const findComponent = (fileMap: FileMap, componentId: string): Component | undefined => {
  const [fileName = '', componentName = ''] = componentId.split('#');
  const components = Object.hasOwn(fileMap, fileName) ? fileMap[fileName]?.components : undefined;
  return components && Object.hasOwn(components, componentName)
    ? components[componentName]
    : undefined;
};

/**
 * The graph that data.service.ts setComponentGraph (lines 93-115) shows, and its view. An unknown
 * componentId shows the app graph as app view (P06-S06). The legacy app showed the app graph too,
 * but counted it as component view (graph.component.ts:120), so the component view rules applied.
 */
const selectGraph = (
  { fileMap, appGraph }: AnalysisResult,
  componentId: string | undefined
): { graph: Graph | undefined; view: View } => {
  const component = componentId ? findComponent(fileMap, componentId) : undefined;
  if (component) {
    return { graph: component.graph, view: 'component' };
  }
  // if only one component show its graph instead of the app graph
  if (hasSingleComponent(fileMap)) {
    const graph = Object.values(Object.values(fileMap)[0]?.components ?? {})[0]?.graph;
    return { graph, view: 'component' };
  }
  return { graph: appGraph, view: 'app' };
};

const copy = <T>(value: T): T => JSON.parse(JSON.stringify(value));

/** Port of helper/generateLinkReferences.ts: link ends become node objects for the layout. */
const resolveLinks = (links: Link[], nodes: ViewNode[]): ViewLink[] =>
  links.flatMap(link => {
    const source = nodes.find(node => node.id === link.source);
    const target = nodes.find(node => node.id === link.target);

    if (!source) {
      // biome-ignore lint/suspicious/noConsole: legacy error message, kept on purpose
      console.error('Did not find link source in nodes:', link.source);
    }
    if (!target) {
      // biome-ignore lint/suspicious/noConsole: legacy error message, kept on purpose
      console.error('Did not find link target in nodes:', link.target);
    }

    // The legacy app kept such a link and d3-force then threw "node not found"; it is left out
    // here instead. The fixtures have no such link.
    return source && target ? [{ ...link, source, target }] : [];
  });

/**
 * Graph of the current view: the component graph for `componentId`, the only component's graph,
 * or the app graph. Returns copies, because the layout mutates the nodes (graph.component.ts:166-171).
 */
export const buildViewGraph = (
  result: AnalysisResult,
  componentId: string | undefined
): ViewGraph | undefined => {
  const { graph, view } = selectGraph(result, componentId);
  if (!graph) {
    return undefined;
  }

  // JSON copy as in the legacy app: drops undefined values, so the data stays identical.
  const size = 2 * graphSettings.circleRadius;
  // Until P05 every node has the legacy size for "Node sizes based on metrics" off
  // (generateNodeSizes, graph.component.ts:249-251).
  const nodes: ViewNode[] = copy(graph.nodes).map(node => ({ ...node, width: size, height: size }));
  const links = resolveLinks(copy(graph.links), nodes);

  return { nodes, links, view };
};
