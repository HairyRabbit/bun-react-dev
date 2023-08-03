import * as ts from 'typescript'
import { typescript_transform_import_specifier } from '../transformer/import'

export function transform_js(content: string, root: string) {
  const result = ts.transpileModule(content, {
    compilerOptions: {
      module: ts.ModuleKind.ESNext,
      jsx: ts.JsxEmit.ReactJSXDev,
    },
    transformers: {
      after: [
        typescript_transform_import_specifier(root),
      ]
    }
  })

  return result.outputText
}