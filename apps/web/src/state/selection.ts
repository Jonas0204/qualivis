// Port of the selection part of the legacy DataService (data.service.ts:117-160, 198-205,
// 231-264): the file map and the report are parameters instead of service state.
import {
    type EscomplexReport,
    type FileMap,
    findReport,
    type Node,
    type VisualIcon,
    type VisualNode,
} from '@qualivis/core';

/** A selected node: the fields the legacy NodeSelection took from the node. */
export type NodeSelection = Pick<VisualNode, 'id' | 'label' | 'type' | 'report' | 'icons'>;

/** What a click selects: a drawn node, or a function of a preview circle (raw graph node). */
export type SelectableNode = Pick<Node, 'id' | 'label' | 'type' | 'report'> & {
    icons?: VisualIcon[];
};

/** The selection of a clicked node (legacy selectNode). */
export const createNodeSelection = ({
    id,
    label,
    type,
    report,
    icons,
}: SelectableNode): NodeSelection => ({ id, label, type, report, icons });

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
        };
    });
};
