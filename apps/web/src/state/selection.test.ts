import { type AnalysisResult, analyzeProject, buildViewModel, type FileMap } from '@qualivis/core';
import { beforeAll, describe, expect, it } from 'vitest';
import { loadFixture } from '../test/fixtures';
import {
    createFileSelection,
    createNodeSelection,
    findNamesById,
    getComponentName,
} from './selection';

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

describe('findNamesById', () => {
    it('splits the node id in the app view and takes the node as function in a component view', () => {
        expect(findNamesById(mini.fileMap, undefined, '/mini/src/App.js#App')).toEqual({
            fileName: '/mini/src/App.js',
            componentName: 'App',
            functionName: undefined,
        });
        expect(findNamesById(mini.fileMap, '/mini/src/App.js#App', 'render')).toEqual({
            fileName: '/mini/src/App.js',
            componentName: 'App',
            functionName: 'render',
        });
    });

    it('uses the only component of a single-component project, whatever the ids', () => {
        const single: FileMap = {
            '/one/A.js': { code: 'code', components: { A: { lineStart: 1, lineEnd: 3 } } },
        };

        expect(findNamesById(single, undefined, 'render')).toEqual({
            fileName: '/one/A.js',
            componentName: 'A',
            functionName: 'render',
        });
    });
});

describe('createNodeSelection', () => {
    it('selects a component of the app view with the code of its file and its lines', () => {
        const node = appNode('/mini/src/App.js#App');

        const { id, label, type, report } = node;
        const selection = createNodeSelection(
            mini.fileMap,
            { id, label, type, report, icons: [] },
            undefined
        );

        expect(selection).toMatchObject({
            id: '/mini/src/App.js#App',
            label: 'App',
            type: 'component',
            icons: [],
            // `export default class App` is on line 8, its closing brace on line 72 (72 − 8 + 1 =
            // 65 = sloc.physical of App in the golden).
            lineStart: 8,
            lineEnd: 72,
        });
        expect(selection.code).toBe(mini.fileMap['/mini/src/App.js']?.code);
        expect(selection.report).toBe(node.report);
    });

    it('selects a function of a component view with its own lines', () => {
        const graph = mini.fileMap['/mini/src/App.js']?.components?.App?.graph;
        const render = graph?.nodes.find(node => node.id === 'render');
        if (!render) {
            throw new Error('no render node');
        }

        const { id, label, type, report } = render;
        const selection = createNodeSelection(
            mini.fileMap,
            { id, label, type, report },
            '/mini/src/App.js#App'
        );

        // render() { … } spans lines 59 to 71 of App.js.
        expect(selection).toMatchObject({ id: 'render', lineStart: 59, lineEnd: 71 });
        expect(selection.code).toBe(mini.fileMap['/mini/src/App.js']?.code);
    });

    it('selects the function of a preview circle with its component as componentId', () => {
        const counter = appNode('/mini/src/components/Counter.tsx#Counter');
        const handleClick = counter.functions?.find(fn => fn.id === 'handleClick#11');
        if (!handleClick) {
            throw new Error('no handleClick#11');
        }

        const { id, label, type, report } = handleClick;
        const selection = createNodeSelection(
            mini.fileMap,
            { id, label, type, report },
            counter.id
        );

        // const handleClick = useCallback(() => { … }) spans lines 11 to 14 of Counter.tsx.
        expect(selection).toMatchObject({ id: 'handleClick#11', lineStart: 11, lineEnd: 14 });
        // Like the legacy app, the functions of the preview circles have no icons (Q5).
        expect(selection.icons).toBeUndefined();
    });

    it('selects a node outside the file map without code and lines (the legacy app threw)', () => {
        const selection = createNodeSelection(
            mini.fileMap,
            { id: 'react-redux#connect', label: 'connect', type: 'component', report: undefined },
            undefined
        );

        expect(selection).toMatchObject({ id: 'react-redux#connect', label: 'connect' });
        expect(selection.code).toBeUndefined();
        expect(selection.lineStart).toBeUndefined();
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
        expect(selection[0]?.code).toBe(mini.fileMap[fileName]?.code);
        // const TodoList = (…) => { … } spans lines 5 to 17.
        expect(selection[0]).toMatchObject({ lineStart: 5, lineEnd: 17 });
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

describe('getComponentName', () => {
    it('names the only component of a file, and nothing for several or an unknown file', () => {
        expect(getComponentName(mini.fileMap, '/mini/src/components/Header.js')).toBe('Header');
        expect(getComponentName(mini.fileMap, '/mini/src/components/TodoList.jsx')).toBeUndefined();
        expect(getComponentName(mini.fileMap, '/nope.js')).toBeUndefined();
    });
});
