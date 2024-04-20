import * as fs from 'fs'
import * as ts from 'typescript'
import { typescript_transform_import_specifier } from '../parser/import'
import { typescript_inject_hmr } from '../parser/hmr-injection'
import transform_react_refresh from 'react-refresh-typescript'
import { TransformResult } from '../transformer'
import { ModuleType, create_module } from '../module_manager'



export function transform_js_file(url: URL, workdir: string): TransformResult {
  const content = fs.readFileSync(url, 'utf-8')
  return transform_js(content, workdir, url)
}

export function transform_js(content: string, root: string, url: URL): TransformResult {
  const result = ts.transpileModule(content, {
    fileName: url.pathname,
    compilerOptions: {
      target: ts.ScriptTarget.ESNext,
      module: ts.ModuleKind.ESNext,
      jsx: ts.JsxEmit.ReactJSXDev,
      jsxImportSource: '/[module]/react',
      isolatedModules: true,
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

  return {
    module: create_module(url, ModuleType.Code, result.outputText, true)
  }
}