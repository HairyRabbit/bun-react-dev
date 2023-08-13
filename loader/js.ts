import * as ts from 'typescript'
import { typescript_transform_import_specifier } from '../transformer/import'
import { typescript_inject_hmr } from '../transformer/hmr-injection'
import transform_react_refresh from 'react-refresh-typescript'

export function transform_js(content: string, root: string, filename: string) {
  const result = ts.transpileModule(content, {
    fileName: filename,
    compilerOptions: {
      target: ts.ScriptTarget.ESNext,
      module: ts.ModuleKind.ESNext,
      jsx: ts.JsxEmit.ReactJSXDev,
      jsxImportSource: '/[module]/react',
    },
    transformers: {
      before: [
        typescript_transform_import_specifier(root),
        transform_react_refresh({
          // refreshReg: 'globalThis.$RefreshReg$',
          // refreshSig: 'globalThis.$RefreshSig$',
          // emitFullSignatures: true
        }),
        typescript_inject_hmr()
      ],
      after: [
        
      ]
    }
  })

  return result.outputText
}