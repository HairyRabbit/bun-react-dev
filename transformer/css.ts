import * as ts from 'typescript'
import * as lightningcss from 'lightningcss'
import * as sass from 'sass'

// sass.compile()

export function transform_css(content: string, root: string, filename: string) {
  const transformed = lightningcss.transform({
    filename,
    cssModules: true,
    code: Buffer.from(content),
    sourceMap: true,
  })
  // console.log(transformed)
  const css_exports = []
  if(transformed.exports) {
    for (const name in transformed.exports) {
      if(transformed.exports[name]) {
        css_exports.push({
          name,
          value: transformed.exports[name].name
        })
      }
    }
  }
  // console.log(css_exports)
  const sourcemap = '/*# sourceMappingURL=data:application/json;base64,' + transformed.map?.toString('base64') + ' */'
  const gen = `
if(globalThis.__REACT_DEV__) import.meta.hot = globalThis.__REACT_DEV__.hmr.register(import.meta.url)
const content = \`\\\n${transformed.code}\n${sourcemap}\`
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

export default {${css_exports.map(item => `${item.name}:"${item.value}"`).join(',')};

  `
  const result = ts.transpileModule(gen, {
    fileName: filename,
    compilerOptions: {
      target: ts.ScriptTarget.ESNext,
      module: ts.ModuleKind.ESNext,
    },
    transformers: {
      before: [
        // typescript_transform_import_specifier(root),
        // transform_react_refresh({
          // refreshReg: 'globalThis.$RefreshReg$',
          // refreshSig: 'globalThis.$RefreshSig$',
          // emitFullSignatures: true
        // }),
        // typescript_inject_hmr()
      ],
      after: [
        
      ]
    }
  })

  return result.outputText
}