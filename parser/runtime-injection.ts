/**
 * inject dev runtime code:
 * 
 * ```ts
 * import { mount } from 'react-dev/runtime'
 * mount(JSON.parse("__CODE__"))
 * ```
 */

import * as ts from 'typescript'
import * as path from 'path'

export type TransformImportOptions = {
  code?: string
}

export const DefaultTransformImportOptions: Required<TransformImportOptions> = {
  code: '{}'
}

export function inject_runtime(
  options: TransformImportOptions = {}
): ts.TransformerFactory<ts.SourceFile> {
  const opt = { ...DefaultTransformImportOptions, ...options }

  return (context: ts.TransformationContext): ts.Transformer<ts.SourceFile> => {
    return (sourcefile: ts.SourceFile) => {

      const factory = context.factory
      const node = factory.updateSourceFile(
        sourcefile, [
        ...create_import_code(factory),
        ...sourcefile.statements,
      ],
        sourcefile.isDeclarationFile,
        sourcefile.referencedFiles,
        sourcefile.typeReferenceDirectives,
        sourcefile.hasNoDefaultLib,
        sourcefile.libReferenceDirectives,
      )

      return node
    }
  }
}

function create_import_code(factory: ts.NodeFactory) {
  return [
    factory.createIfStatement(
      factory.createPropertyAccessExpression(
        factory.createIdentifier("globalthis"),
        factory.createIdentifier("__REACT_DEV__")
      ),
      factory.createBlock(
        [factory.createExpressionStatement(factory.createBinaryExpression(
          factory.createPropertyAccessExpression(
            factory.createMetaProperty(
              ts.SyntaxKind.ImportKeyword,
              factory.createIdentifier("meta")
            ),
            factory.createIdentifier("hot")
          ),
          factory.createToken(ts.SyntaxKind.EqualsToken),
          factory.createCallExpression(
            factory.createPropertyAccessExpression(
              factory.createPropertyAccessExpression(
                factory.createIdentifier("globalThis"),
                factory.createIdentifier("__REACT_DEV__")
              ),
              factory.createIdentifier("register_hmr")
            ),
            undefined,
            [factory.createPropertyAccessExpression(
              factory.createMetaProperty(
                ts.SyntaxKind.ImportKeyword,
                factory.createIdentifier("meta")
              ),
              factory.createIdentifier("url")
            )]
          )
        ))],
        true
      ),
      undefined
    )
  ]
}