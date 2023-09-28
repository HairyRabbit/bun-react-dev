import * as ts from 'typescript'
import { typescript_transform_import_specifier } from '../parser/import'
import { typescript_inject_hmr } from '../parser/hmr-injection'
import transform_react_refresh from 'react-refresh-typescript'
import { BunFile } from 'bun'


export async function transform_js_file(file: BunFile, base_url: string) {
  const filename = file.name!
  const content = await file.text()

  const result = ts.transpileModule(content, {
    fileName: filename,
    compilerOptions: {
      target: ts.ScriptTarget.ESNext,
      module: ts.ModuleKind.ESNext,
      jsx: ts.JsxEmit.ReactJSXDev,
      jsxImportSource: '/[module]/react',
      sourceMap: true,
      inlineSourceMap: true,
    },
    transformers: {
      before: [
        typescript_transform_import_specifier(base_url),
        transform_react_refresh(),
        typescript_inject_hmr(),
      ],
      after: [
        
      ]
    }
  })

  return result.outputText
}

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