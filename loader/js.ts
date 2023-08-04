import * as ts from 'typescript'
import { typescript_transform_import_specifier } from '../transformer/import'
import transform_react_refresh from 'react-refresh-typescript'

export function transform_js(content: string, root: string, filename: string) {
  const result = ts.transpileModule(content, {
    fileName: filename,
    compilerOptions: {
      module: ts.ModuleKind.ESNext,
      jsx: ts.JsxEmit.ReactJSXDev,
    },
    transformers: {
      before: [
        typescript_transform_import_specifier(root),
        transform_react_refresh({
          emitFullSignatures: true
        }),
      ],
      after: [
        
      ]
    }
  })

  return result.outputText
}