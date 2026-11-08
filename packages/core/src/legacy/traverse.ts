import _babelTraverse from '@babel/traverse';
import type * as t from '@babel/types';
import { cjsDefault } from '../analysis/interop';
import type { AstWithPath, ComponentMap } from '../model/fileMap';
import { traverseClassComponent } from './traverseClassComponent';
import { traverseFunctionComponent } from './traverseFunctionComponent';
import {
  findCallExpressionInnerArgument,
  getComponentDependency,
  getComponentFileFromImportPath,
  getImportPathFromImportSpecifier,
  isReactClassComponent,
  isReactFunctionComponent
} from './traverseHelper';

const babelTraverse = cjsDefault(_babelTraverse);

export function traverse(asts: AstWithPath[], fileName: string, fullReport): { components: ComponentMap; defaultExport: string | null } {
  const ast: t.File = asts.find(theAst => theAst.srcPath === fileName)!.ast;
  const components: ComponentMap = {};
  let defaultExport: string | null = null;

  if (!ast) {
    console.error('AST not found:', fileName);
  }

  babelTraverse(ast, {
    ClassDeclaration: path => {
      if (isReactClassComponent(path, asts, fileName)) {
        path.skip();
        const classComponentName = path.node.id!.name;
        components[classComponentName] = traverseClassComponent(
          path,
          classComponentName,
          fileName,
          asts,
          fullReport
        );
      }
    },
    FunctionDeclaration: path => {
      if (isReactFunctionComponent(path)) {
        path.skip();
        const functionComponentName = path.node.id!.name;
        components[functionComponentName] = traverseFunctionComponent(
          path,
          functionComponentName,
          fileName,
          asts,
          fullReport
        );
      }
    },
    'FunctionExpression|ArrowFunctionExpression': path => {
      if (!path.parentPath!.isVariableDeclarator() && !path.parentPath!.isCallExpression()) {
        return;
      }
      if (isReactFunctionComponent(path)) {
        path.skip();
        const functionComponentName = (path.findParent(p => p.isVariableDeclarator())!.node as any).id.name; // legacy: untyped Babel access
        components[functionComponentName] = traverseFunctionComponent(
          path,
          functionComponentName,
          fileName,
          asts,
          fullReport
        );
      }
    },
    ExportDefaultDeclaration: path => {
      if ((path.node.declaration as t.ClassDeclaration).id) {
        defaultExport = (path.node.declaration as t.ClassDeclaration).id!.name;
      } else if (
        path.get('declaration').isAssignmentExpression() &&
        path.get('declaration.left').isIdentifier()
      ) {
        defaultExport = (path.node.declaration as any).left.name; // legacy: untyped Babel access
      } else if (path.get('declaration').isIdentifier()) {
        defaultExport = (path.node.declaration as t.Identifier).name;

        const binding = path.scope.getBinding(defaultExport)!;
        let name = '';
        if (binding.path.isImportDefaultSpecifier()) {
          name = 'default';
        } else if (binding.path.isImportSpecifier()) {
          name = defaultExport;
        } else {
          return;
        }
        const source = getImportPathFromImportSpecifier(
          binding.path,
          defaultExport,
          asts,
          fileName
        );

        const componentFile = getComponentFileFromImportPath(source!, asts);

        if (!componentFile) {
          console.error('Component file not found', source);
          return;
        }

        const componentPath = componentFile.srcPath;

        defaultExport = `${componentPath}#${name}`;
      } else if (path.get('declaration').isCallExpression()) {
        const identifierArgument = findCallExpressionInnerArgument(path.get('declaration'));

        if (identifierArgument) {
          defaultExport = identifierArgument.node.name;
        }
      } else if (
        path.get('declaration').isFunctionDeclaration() &&
        isReactFunctionComponent(path.get('declaration'))
      ) {
        defaultExport = (path.node as any).id.name; // legacy: untyped Babel access
      }
    },
    CallExpression: path => {
      if (
        !path.parentPath.isVariableDeclarator() ||
        !path.get('callee').isCallExpression() ||
        (path.node.callee as any).callee.name !== 'connect' || // legacy: untyped Babel access
        path.get('arguments').length === 0
      ) {
        return;
      }

      const arg = path.get('arguments')[0];

      if (arg.isIdentifier()) {
        const componentDependency = getComponentDependency(arg, fileName, asts);
        if (!componentDependency) {
          return;
        }
        const componentName = (path.parentPath.node.id as t.Identifier).name;
        components[componentName] = {
          dependencies: [componentDependency],
          lineStart: path.node.loc!.start.line,
          lineEnd: path.node.loc!.end.line
        };
      }
    }
  });

  return { components, defaultExport };
}
