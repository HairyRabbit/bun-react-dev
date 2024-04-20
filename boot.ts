import * as ts from "typescript"
import { typescript_transform_import_specifier } from "./parser/import"
import * as path from "path"

export type BootOptions = {
  strict_mode?: boolean,
}

export function generate_boot_code(workdir: string, options: BootOptions = {}) {
  const strict_mode = options.strict_mode ?? true

  const code = []

  code.push(`import 'bun-react-dev/runtime'`)
  code.push('import { createRoot } from "react-dom/client"')

  if(strict_mode) {
    code.push(`import { StrictMode } from "react"`)
  }

  code.push(`import App from '/[app]'`)

  code.push(`globalThis.addEventListener("DOMContentLoaded", main)`)

  code.push(`function main() {`)
  code.push(`const root = createRoot(document.getElementById("root")!)`)

  if(strict_mode) {
    code.push(`root.render(<StrictMode><App /></StrictMode>)`)
  }
  else {
    code.push(`root.render(<App />)`)
  }
  code.push(`}`)

  const result = ts.transpileModule(code.join('\n'), {
    fileName: path.join(workdir, 'boot.tsx'),
    compilerOptions: {
      target: ts.ScriptTarget.ESNext,
      module: ts.ModuleKind.ESNext,
      jsx: ts.JsxEmit.ReactJSXDev,
      jsxImportSource: '/[module]/react',
      inlineSourceMap: true,
    },
    transformers: {
      before: [
        typescript_transform_import_specifier(workdir),
      ],
      after: []
    }
  })

  return result.outputText
}

export function is_boot_file_url(url: URL) {
  
}