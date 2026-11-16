import { type AnalysisResult, analyzeProject, buildViewModel } from '@qualivis/core';
import { beforeAll, describe, expect, it } from 'vitest';
import { loadFixture } from '../../test/fixtures';
import { createFileSelection, createNodeSelection } from '../selection';

let mini: AnalysisResult;

beforeAll(() => {
    mini = analyzeProject(loadFixture('mini'));
});

const appNode = (id: string) => {
    const node = mini.appGraph.nodes.find(each => each.id === id);
    if (!node) {
        throw new Error(`no node ${id}`);
    }
    return node;
};

const appIcons = () =>
    new Map(
        buildViewModel(mini.appGraph, {
            view: 'app',
            sizeMetric: 'sloc.physical',
            nodeSizesBasedOnMetrics: true,
        }).nodes.map(node => [node.id, node.icons ?? []])
    );

describe('createNodeSelection', () => {
    it('keeps the fields of the legacy NodeSelection', () => {
        const node = appNode('/mini/src/App.js#App');

        const { id, label, type, report } = node;
        const selection = createNodeSelection({ id, label, type, report, icons: [] });

        expect(selection).toEqual({
            id: '/mini/src/App.js#App',
            label: 'App',
            type: 'component',
            report: node.report,
            icons: [],
        });
    });

    it('selects the function of a preview circle without icons (Q5)', () => {
        const counter = appNode('/mini/src/components/Counter.tsx#Counter');
        const handleClick = counter.functions?.find(fn => fn.id === 'handleClick#11');
        if (!handleClick) {
            throw new Error('no handleClick#11');
        }

        const { id, label, type, report } = handleClick;
        const selection = createNodeSelection({ id, label, type, report });

        expect(selection).toMatchObject({ id: 'handleClick#11', label: handleClick.label });
        expect(selection.icons).toBeUndefined();
    });
});

describe('createFileSelection', () => {
    it('selects every component of the file, in the order of the file map', () => {
        const fileName = '/mini/src/components/TodoList.jsx';

        const selection = createFileSelection(mini.fileMap, mini.report, fileName, appIcons());

        expect(selection.map(each => each.id)).toEqual([
            `${fileName}#TodoList`,
            `${fileName}#ConnectedTodoList`,
        ]);
        expect(selection[0]).toMatchObject({ label: 'TodoList', type: 'component' });
        expect(selection[0]?.report).toBeDefined();
    });

    it('gives the components the icons of their app graph node (correction ADR-011 A9)', () => {
        const fileName = '/mini/src/components/Header.js';

        const [header] = createFileSelection(mini.fileMap, mini.report, fileName, appIcons());

        // Header extends BaseWidget: the inheritance icon of the app graph.
        expect(header?.icons?.map(icon => icon.icon)).toContain('device_hub');
        expect(header?.icons).toEqual(appIcons().get(`${fileName}#Header`));
    });

    it('selects nothing for an unknown file', () => {
        expect(createFileSelection(mini.fileMap, mini.report, '/nope.js', new Map())).toEqual([]);
    });
});
