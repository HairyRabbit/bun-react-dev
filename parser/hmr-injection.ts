/**
 * inject hmr runtime code, like:
 * 
 * ```ts
 * if(globalthis.__REACT_DEV__)
 * import.meta.hot = globalThis.__REACT_DEV__.hmr.register(import.meta.url)
 * 
 * if(import.meta.hot) {
 *   import.meta.hot.accept()
 * }
 * ```
 * 
 * 1. when file is jsx/tsx, inject react-refresh code:
 * 
 * ```ts
 * var prevRefreshReg = globalThis.$RefreshReg$;
 * var prevRefreshSig = globalThis.$RefreshSig$;
 * 
 * /// user code here
 * 
 * if(import.meta.hot) {
 *   globalThis.$RefreshReg$ = prevRefreshReg;
 *   globalThis.$RefreshSig$ = prevRefreshSig;
 * 
 *   import.meta.hot.accept(performReactRefresh)
 * }
 * ```
 * 
 * 2. when file is scss/css, inject style code:
 * 
 * ```ts
 * if(import.meta.hot) {
 *   globalThis.__REACT_DEV__.mount_stylesheet(code)
 * }
 * ```
 */

import * as ts from 'typescript'
import * as path from 'path'

export type TransformImportOptions = {
  filter?: RegExp
}

export const DefaultTransformImportOptions: Required<TransformImportOptions> = {
  filter: /\.[jt]sx$/
}

export function typescript_inject_hmr(
  options: TransformImportOptions = {}
): ts.TransformerFactory<ts.SourceFile> {
  const opt = { ...DefaultTransformImportOptions, ...options }

  return (context: ts.TransformationContext): ts.Transformer<ts.SourceFile> => {
    return (sourcefile: ts.SourceFile) => {

      const factory = context.factory
      const node = factory.updateSourceFile(
        sourcefile, [
        ...create_hmr_register_code(factory),
        ...create_react_refresh_register_code(factory),
        ...sourcefile.statements,
        ...create_react_refresh_accept_code(factory),
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

function create_hmr_register_code(factory: ts.NodeFactory) {
  return [
    factory.createIfStatement(
      factory.createPropertyAccessExpression(
        factory.createIdentifier("globalThis"),
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
                factory.createPropertyAccessExpression(
                  factory.createIdentifier("globalThis"),
                  factory.createIdentifier("__REACT_DEV__")
                ),
                factory.createIdentifier("hmr")
              ),
              factory.createIdentifier("register")
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

function create_react_refresh_register_code(factory: ts.NodeFactory) {
  return [
    factory.createVariableStatement(
      undefined,
      factory.createVariableDeclarationList(
        [
          factory.createVariableDeclaration(
            factory.createIdentifier("__RefreshReg__"),
            undefined,
            undefined,
            undefined
          ),
          factory.createVariableDeclaration(
            factory.createIdentifier("__RefreshSig__"),
            undefined,
            undefined,
            undefined
          )
        ],
        ts.NodeFlags.Let
      )
    ),
    factory.createIfStatement(
      factory.createPropertyAccessExpression(
        factory.createMetaProperty(
          ts.SyntaxKind.ImportKeyword,
          factory.createIdentifier("meta")
        ),
        factory.createIdentifier("hot")
      ),
      factory.createBlock(
        [
          factory.createExpressionStatement(factory.createBinaryExpression(
            factory.createIdentifier("__RefreshReg__"),
            factory.createToken(ts.SyntaxKind.EqualsToken),
            factory.createPropertyAccessExpression(
              factory.createIdentifier("globalThis"),
              factory.createIdentifier("$RefreshReg$")
            )
          )),
          factory.createExpressionStatement(factory.createBinaryExpression(
            factory.createIdentifier("__RefreshSig__"),
            factory.createToken(ts.SyntaxKind.EqualsToken),
            factory.createPropertyAccessExpression(
              factory.createIdentifier("globalThis"),
              factory.createIdentifier("$RefreshSig$")
            )
          )),
          factory.createExpressionStatement(factory.createBinaryExpression(
            factory.createPropertyAccessExpression(
              factory.createIdentifier("globalThis"),
              factory.createIdentifier("$RefreshReg$")
            ),
            factory.createToken(ts.SyntaxKind.EqualsToken),
            factory.createArrowFunction(
              undefined,
              undefined,
              [
                factory.createParameterDeclaration(
                  undefined,
                  undefined,
                  factory.createIdentifier("type"),
                  undefined,
                  undefined,
                  undefined
                ),
                factory.createParameterDeclaration(
                  undefined,
                  undefined,
                  factory.createIdentifier("id"),
                  undefined,
                  undefined,
                  undefined
                )
              ],
              undefined,
              factory.createToken(ts.SyntaxKind.EqualsGreaterThanToken),
              factory.createBlock(
                [factory.createExpressionStatement(factory.createCallExpression(
                  factory.createPropertyAccessExpression(
                    factory.createPropertyAccessExpression(
                      factory.createPropertyAccessExpression(
                        factory.createIdentifier("globalThis"),
                        factory.createIdentifier("__REACT_DEV__")
                      ),
                      factory.createIdentifier("react_refresh")
                    ),
                    factory.createIdentifier("register")
                  ),
                  undefined,
                  [
                    factory.createIdentifier("type"),
                    factory.createBinaryExpression(
                      factory.createBinaryExpression(
                        factory.createPropertyAccessExpression(
                          factory.createPropertyAccessExpression(
                            factory.createMetaProperty(
                              ts.SyntaxKind.ImportKeyword,
                              factory.createIdentifier("meta")
                            ),
                            factory.createIdentifier("hot")
                          ),
                          factory.createIdentifier("id")
                        ),
                        factory.createToken(ts.SyntaxKind.PlusToken),
                        factory.createStringLiteral(":")
                      ),
                      factory.createToken(ts.SyntaxKind.PlusToken),
                      factory.createIdentifier("id")
                    )
                  ]
                ))],
                true
              )
            )
          )),
          factory.createExpressionStatement(factory.createBinaryExpression(
            factory.createPropertyAccessExpression(
              factory.createIdentifier("globalThis"),
              factory.createIdentifier("$RefreshSig$")
            ),
            factory.createToken(ts.SyntaxKind.EqualsToken),
            factory.createPropertyAccessExpression(
              factory.createPropertyAccessExpression(
                factory.createPropertyAccessExpression(
                  factory.createIdentifier("globalThis"),
                  factory.createIdentifier("__REACT_DEV__")
                ),
                factory.createIdentifier("react_refresh")
              ),
              factory.createIdentifier("createSignatureFunctionForTransform")
            ),
          ))
        ],
        true
      ),
      undefined
    )
  ]
}

function create_react_refresh_accept_code(factory: ts.NodeFactory) {
  return [
    factory.createIfStatement(
      factory.createPropertyAccessExpression(
        factory.createMetaProperty(
          ts.SyntaxKind.ImportKeyword,
          factory.createIdentifier("meta")
        ),
        factory.createIdentifier("hot")
      ),
      factory.createBlock(
        [
          factory.createExpressionStatement(factory.createBinaryExpression(
            factory.createPropertyAccessExpression(
              factory.createIdentifier("globalThis"),
              factory.createIdentifier("$RefreshReg$")
            ),
            factory.createToken(ts.SyntaxKind.EqualsToken),
            factory.createIdentifier("__RefreshReg__")
          )),
          factory.createExpressionStatement(factory.createBinaryExpression(
            factory.createPropertyAccessExpression(
              factory.createIdentifier("globalThis"),
              factory.createIdentifier("$RefreshSig$")
            ),
            factory.createToken(ts.SyntaxKind.EqualsToken),
            factory.createIdentifier("__RefreshSig__")
          )),
          factory.createExpressionStatement(factory.createCallExpression(
            factory.createPropertyAccessExpression(
              factory.createPropertyAccessExpression(
                factory.createMetaProperty(
                  ts.SyntaxKind.ImportKeyword,
                  factory.createIdentifier("meta")
                ),
                factory.createIdentifier("hot")
              ),
              factory.createIdentifier("accept")
            ),
            undefined,
            [factory.createPropertyAccessExpression(
              factory.createPropertyAccessExpression(
                factory.createPropertyAccessExpression(
                  factory.createIdentifier("globalThis"),
                  factory.createIdentifier("__REACT_DEV__")
                ),
                factory.createIdentifier("react_refresh")
              ),
              factory.createIdentifier("refresh")
            ),]
          ))
        ],
        true
      ),
      undefined
    )
  ]  
}