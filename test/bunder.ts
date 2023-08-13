// const { parse } = require('cjs-module-lexer')
// import * as fs from 'fs'
// import * as path from 'path'

// const transpiler = new Bun.Transpiler({
//   loader: 'ts',
// })

// const result = await Bun.build({
//   entrypoints: ['react'],
//   target: 'browser',
// })

// // const content = await result.outputs[0].text()
// let file_path = import.meta.resolveSync('../runtime')
// // file_path = path.resolve(path.dirname(file_path), './cjs/react.development.js')
// console.log(file_path)
// const content = fs.readFileSync(file_path, 'utf-8')
// const result_scan = await parse(transpiler.transformSync(content))
// // const result_scan = transpiler.scan(content)

// console.log(result_scan)


import * as esbuild from 'esbuild'

const result = await esbuild.build({
  entryPoints: ['react'],
  // target: 'browser',
  bundle: true,
  format: 'esm',
  outfile: 'react_bundle.js'
})

console.log(result)

// import * as vm from 'vm'
// const context = {}
// vm.createContext(context)
// vm.runInContext(`
// const m = await  import('../runtime')
// console.log(m)
// `, context)

