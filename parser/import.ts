/**
 * transform import specifier for browser esm
 * 
 * when a specifier starts with dot, rewrite from relative current file path 
 * to relative root directory, otherwise rewrite module name to flag + module 
 * name.
 * 
 * todos:
 * 1. name alias supports
 * 2. caller arguments expression parser
 */

import * as ts from 'typescript'
import * as path from 'path'

export type TransformImportOptions = {
  module?: string
}

export const DefaultTransformImportOptions: Required<TransformImportOptions> = {
  module: '/[module]/'
}

export function typescript_transform_import_specifier(
  root: string,
  options: TransformImportOptions = {}
): ts.TransformerFactory<ts.SourceFile> {
  const opt = { ...DefaultTransformImportOptions, ...options }

  return (context: ts.TransformationContext): ts.Transformer<ts.SourceFile> => {
    return (sourcefile: ts.SourceFile) => {
      const visitor: ts.Visitor = node => {
        const filename = sourcefile.fileName
        let specifier: string | undefined = undefined

        if ((ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) && node.moduleSpecifier) { // match import 'specifier' or export 'specifier'
          specifier = node.moduleSpecifier.getText(sourcefile).slice(1, -1)
        }
        else if (is_dynamic_import_call(node)) { // match import('specifier')
          specifier = node.arguments[0].getText(sourcefile).slice(1, -1)
        }

        if (specifier) {
          let override = ''
          if (specifier.startsWith('.')) {
            override = override_specifier(filename, root, specifier)
          }
          else {
            override = opt.module + specifier
          }

          if (override !== specifier) {
            if (ts.isImportDeclaration(node)) {
              return context.factory.updateImportDeclaration(
                node,
                node.modifiers,
                node.importClause,
                context.factory.createStringLiteral(override),
                node.assertClause,
              )
            }
            else if (ts.isExportDeclaration(node)) {
              return context.factory.updateExportDeclaration(
                node,
                node.modifiers,
                node.isTypeOnly,
                node.exportClause,
                context.factory.createStringLiteral(override),
                node.assertClause,
              )
            }
            else if (ts.isCallExpression(node)) {
              return context.factory.updateCallExpression(
                node,
                node.expression,
                node.typeArguments,
                context.factory.createNodeArray([
                  context.factory.createStringLiteral(override),
                ])
              )
            }
          }
          return node
        }

        return ts.visitEachChild(node, visitor, context)
      }

      return ts.visitEachChild(sourcefile, visitor, context)
    }
  }
}

function is_dynamic_import_call(node: ts.Node): node is ts.CallExpression {
  return ts.isCallExpression(node) 
  && node.expression.kind === ts.SyntaxKind.ImportKeyword 
  && node.arguments[0] 
  // && ts.isStringLiteral(node.arguments[0])
  && ts.isStringLiteralLike(node.arguments[0])
}

function override_specifier(filename: string, root: string, specifer: string) {
  const filepath = path.isAbsolute(filename) ? filename : path.resolve(root, filename)
  const resolved = import.meta.resolveSync(specifer, filepath)
  console.log(filepath, resolved)
  return '/' + path.relative(root, resolved)
}