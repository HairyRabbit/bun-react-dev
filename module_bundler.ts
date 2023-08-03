import * as fs from 'fs'
import * as path from 'path'
import { tmpdir } from 'os'
import type { Transpiler } from 'bun'

export type BundleModuleOptions = {
  force?: boolean
}

const DefaultBundleModuleOptions: Required<BundleModuleOptions> = {
  force: false
}

export async function bundle_module(name: string, output: string, options: BundleModuleOptions = {}) {
  const opt = { ...DefaultBundleModuleOptions, options }

  if(false === opt.force) {
    const target_path = path.resolve(output, name + '.js')
    if(fs.existsSync(target_path)) return target_path
  }

  const resolved = await import.meta.resolve(name)
  const transpier = new Bun.Transpiler()
  
  const dependencies = [...get_dependencies(new Set, transpier, resolved)]

  const workdir = tmpdir()

  const result1 = await Bun.build({
    entrypoints: [resolved],
    target: 'browser',
    outdir: workdir,
    // outdir: './build',
    naming: name + '.js',
    format: 'esm',
    external: dependencies,
  })

  console.log(result1)
  console.log(transpier.scan(fs.readFileSync(result1.outputs[0].path)))

  const { default: _, ...mod } = await import(resolved)
  const wrapper_path = path.resolve(workdir, name + '.shell.js')
  const module_build_path = './' + path.basename(result1.outputs[0].path)
  // console.log(module_build_path)

  const shell = `\
  import __default__ from "${module_build_path}";
  export const {${Object.keys(mod).join(',')}} = __default__;
  export default __default__
  `
  fs.writeFileSync(wrapper_path, shell)

  const result = await Bun.build({
    entrypoints: [wrapper_path],
    target: 'browser',
    outdir: output,
    naming: name + '.js',
    format: 'esm',
    external: dependencies,
  })

  console.log(result)


  await Promise.all(dependencies.map(dep => bundle_module(dep, output, options)))

  return result.outputs[0].path
}

// bundle_module('./node_modules/react-dom/cjs/react-dom.development.js')
// bundle_module('react/jsx-dev-runtime', path.resolve('./build'))

function get_dependencies(dependencies: Set<string>, transpiler: Transpiler, filepath: string) {
  const code = fs.readFileSync(filepath, 'utf-8')
  const imports = transpiler.scanImports(code)

  imports.forEach(({ path: import_path }) => {
    if(import_path.startsWith('.')) {
      const absolute_path = path.resolve(path.dirname(filepath), import_path)
      get_dependencies(dependencies, transpiler, absolute_path)
    }
    else {
      dependencies.add(import_path)
    }
  })

  return dependencies
}