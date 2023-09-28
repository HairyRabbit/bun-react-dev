import * as ts from 'typescript'
import * as lightningcss from 'lightningcss'
import { RawSourceMap } from 'source-map-js'
import { make_inline_sourcemap } from '../sourcemap'
import { BunFile } from 'bun'

export async function transform_css_file(file: BunFile) {
  const code = await file.arrayBuffer()

  const result = lightningcss.transform({
    filename: file.toString(),
    cssModules: true,
    code: Buffer.from(code),
    sourceMap: true,
  })

  const filepath = file.name!

  return { 
    ...result, 
    sourcemap: override_sourcemap(result.map!, filepath),
    css_exports: create_classnames_map(result.exports),
  }
}

export function transform_css_content(content: string, filepath: string) {
  const result = lightningcss.transform({
    filename: filepath,
    cssModules: true,
    code: Buffer.from(content),
    sourceMap: true,
  })

  return { 
    ...result, 
    sourcemap: override_sourcemap(result.map!, filepath),
    css_exports: create_classnames_map(result.exports),
  }
}

function override_sourcemap(map: Buffer, filepath: string) {
  const sourcemap = JSON.parse(map!.toString()) as RawSourceMap
  sourcemap.file = filepath
  return sourcemap
}

function create_classnames_map(css_exports: lightningcss.TransformResult['exports']) {
  const map: Map<string, string> = new Map
  if (css_exports) {
    for (const name in css_exports) {
      if (css_exports[name]) {
        map.set(name, css_exports[name].name)
      }
    }
  }
  return map
}

export function generate_style_code(code: string, exports: Map<string, string>, sourcemap: RawSourceMap) {
  const exports_str: string[] = []
  exports.forEach((transformed, classname) => {
    exports_str.push(`${classname}:"${transformed}"`)
  })

  const gen = `
if(globalThis.__REACT_DEV__) import.meta.hot = globalThis.__REACT_DEV__.hmr.register(import.meta.url)
const content = \`\\\n${code}\n${make_inline_sourcemap(sourcemap)}\`
const id = new URL(import.meta.url).pathname

const stylesheet = document.createElement('style')
stylesheet.id = id
stylesheet.textContent = content
document.head.appendChild(stylesheet)

if(import.meta.hot) {
  import.meta.hot.accept()
  import.meta.hot.dispose(() => {
    const node = document.getElementById(id)
    console.log(node)
    document.head.removeChild(node)
  })
}

export default {${exports_str.join(',')};
`

  const result = ts.transpileModule(gen, {
    compilerOptions: {
      target: ts.ScriptTarget.ESNext,
      module: ts.ModuleKind.ESNext,
    },
    transformers: {
      before: [],
      after: []
    }
  })

  return result.outputText
}
