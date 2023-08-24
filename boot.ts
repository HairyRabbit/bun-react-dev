export type BootOptions = {
  strict_mode?: boolean,
}


export function generate_boot_code(options: BootOptions = {}) {
  const code = []

  code.push(`import 'bun-react-dev/runtime'`)
  code.push('import { createRoot } from "react-dom/client"')

  if(options.strict_mode) {
    code.push(`import { StrictMode } from "react"`)
  }

  code.push(`import App from './App.tsx'`)

  code.push(`globalThis.addEventListener("DOMContentLoaded", main)`)

  code.push(`function main() {`)
  code.push(`const root = createRoot(document.getElementById("root")!)`)

  if(options.strict_mode) {
    code.push(`root.render(<StrictMode><App /></StrictMode>)`)
  }
  else {
    code.push(`root.render(<App />)`)
  }
  code.push(`}`)

  // const code_str = code.join('\n')
  // const transpiler = new Bun.Transpiler()
  // return transpiler.transformSync(code_str, 'tsx')
  return code.join('\n')
}