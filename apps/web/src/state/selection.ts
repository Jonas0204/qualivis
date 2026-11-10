// Port of the selection part of the legacy DataService (data.service.ts:117-160, 198-205,
// 231-264): the file map and the report are parameters instead of service state.
import {
    type EscomplexReport,
    type FileMap,
    findReport,
    hasSingleComponent,
    type Node,
    type VisualIcon,
    type VisualNode,
} from '@qualivis/core';

/** A selected node: the fields the legacy NodeSelection took from the node. */
export type SelectedNode = Pick<VisualNode, 'id' | 'label' | 'type' | 'report' | 'icons'>;

/** A selection as the panels need it: the node plus the code of its file and its lines. */
export type NodeSelection = SelectedNode & {
    code?: string;
    lineStart?: number;
    lineEnd?: number;
};

/** What a click selects: a drawn node, or a function of a preview circle (raw graph node). */
export type SelectableNode = Pick<Node, 'id' | 'label' | 'type' | 'report'> & {
    icons?: VisualIcon[];
};

/** Names of the file, component and function a node id stands for (legacy findNamesById). */
export const findNamesById = (
    fileMap: FileMap,
    componentId: string | undefined,
    nodeId?: string
): { fileName?: string; componentName?: string; functionName?: string } => {
    let fileName: string | undefined;
    let componentName: string | undefined;
    let functionName: string | undefined;

    if (hasSingleComponent(fileMap)) {
        fileName = Object.keys(fileMap)[0];
        componentName = fileName ? Object.keys(fileMap[fileName]?.components ?? {})[0] : undefined;
        functionName = nodeId;
    } else if (componentId) {
        [fileName, componentName] = componentId.split('#');
        functionName = nodeId;
    } else if (nodeId) {
        [fileName, componentName] = nodeId.split('#');
    }

    return { fileName, componentName, functionName };
};

/**
 * The component, or the function node in its graph (legacy findComponentOrFunctionById). The
 * legacy code threw for a node outside the file map (an imported component that was not
 * uploaded); here it finds nothing and the selection has no lines (ADR-011 A20).
 */
const findComponentOrFunction = (
    fileMap: FileMap,
    componentId: string | undefined,
    nodeId: string
): { lineStart?: number; lineEnd?: number } | undefined => {
    const { fileName, componentName, functionName } = findNamesById(fileMap, componentId, nodeId);
    const components = fileName ? fileMap[fileName]?.components : undefined;
    const component = componentName ? components?.[componentName] : undefined;

    if (functionName) {
        return component?.graph?.nodes.find(node => node.id === functionName);
    }
    return component;
};

const findCode = (fileMap: FileMap, nodeId: string, componentId?: string) => {
    const { fileName } = findNamesById(fileMap, componentId, nodeId);
    return fileName ? fileMap[fileName]?.code : undefined;
};

/** The selection of a clicked node (legacy selectNode); `componentId` is set in a component view. */
export const createNodeSelection = (
    fileMap: FileMap,
    { id, label, type, report, icons }: SelectableNode,
    componentId: string | undefined
): NodeSelection => {
    const componentOrFunction = findComponentOrFunction(fileMap, componentId, id);
    return {
        id,
        label,
        type,
        report,
        icons,
        code: findCode(fileMap, id, componentId),
        lineStart: componentOrFunction?.lineStart,
        lineEnd: componentOrFunction?.lineEnd,
    };
};

/**
 * All components of a file (legacy selectFile). Correction ADR-011 A9: the legacy app gave them no
 * icons ("TODO"); here they get the icons of the node with the same id in the app graph.
 */
export const createFileSelection = (
    fileMap: FileMap,
    report: EscomplexReport,
    fileName: string,
    iconsById: ReadonlyMap<string, VisualIcon[]>
): NodeSelection[] => {
    const file = fileMap[fileName];
    const components = file?.components;
    if (!file || !components) {
        return [];
    }

    return Object.keys(components).map(componentName => {
        const id = `${fileName}#${componentName}`;
        return {
            id,
            label: componentName,
            type: 'component',
            report: findReport(report, fileMap, fileName, componentName),
            icons: iconsById.get(id) ?? [],
            code: file.code,
            lineStart: components[componentName]?.lineStart,
            lineEnd: components[componentName]?.lineEnd,
        };
    });
};

/** The only component of a file; undefined for none or several (legacy getComponentName). */
export const getComponentName = (fileMap: FileMap, fileName: string): string | undefined => {
    const file = fileMap[fileName];
    const names = Object.keys(file?.components ?? {});
    if (!file || names.length !== 1) {
        return undefined;
    }
    return names[0];
};
