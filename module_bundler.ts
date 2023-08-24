import * as fs from 'fs'
import * as path from 'path'
import { tmpdir } from 'os'
import type { Transpiler } from 'bun'
import * as ts from 'typescript'
import { typescript_transform_import_specifier } from './parser/import'

export type BundleModuleOptions = {
  force?: boolean
}

const DefaultBundleModuleOptions: Required<BundleModuleOptions> = {
  force: false
}

export async function bundle_module(
  name: string,
  output: string,
  root: string,
  options: BundleModuleOptions = {}
) {
  const opt = { ...DefaultBundleModuleOptions, options }

  if (false === opt.force) {
    const target_path = path.resolve(output, name + '.js')
    if (fs.existsSync(target_path)) return target_path
  }

  const resolved = await import.meta.resolve(name, root)
  const transpier = new Bun.Transpiler({
    loader: 'tsx'
  })

  const dependencies = [...get_dependencies(new Set, transpier, resolved)]
  console.log(resolved, dependencies)

  const workdir = tmpdir()

  let result = await Bun.build({
    entrypoints: [resolved],
    target: 'browser',
    outdir: workdir,
    naming: name + '.js',
    format: 'esm',
    external: dependencies,
  })

  // console.log(result1)
  // console.log(transpier.scan(fs.readFileSync(result1.outputs[0].path)))

  console.log('err', resolved)
  const { default: default_export, ...mod } = await import(resolved)

  if (default_export) {
    console.log('export:', resolved, default_export, mod)
    const wrapper_path = path.resolve(workdir, name + '.shell.js')
    const module_build_path = './' + path.basename(result.outputs[0].path)
    // console.log(module_build_path)

    const shell = `\
  import __default__ from "${module_build_path}";
  export const {${Object.keys(mod).join(',')}} = __default__;
  export default __default__
  `
    fs.writeFileSync(wrapper_path, shell)

    result = await Bun.build({
      entrypoints: [wrapper_path],
      target: 'browser',
      outdir: output,
      naming: name + '.js',
      format: 'esm',
      external: dependencies,
    })
  }

  const content = fs.readFileSync(result.outputs[0].path, 'utf-8')
  const override_result = ts.transpileModule(content, {
    fileName: result.outputs[0].path,
    compilerOptions: {
      target: ts.ScriptTarget.ESNext,
      module: ts.ModuleKind.ESNext,
    },
    transformers: {
      after: [
        typescript_transform_import_specifier(''),
      ]
    }
  })
  fs.writeFileSync(result.outputs[0].path, override_result.outputText)
  // console.log(result)

  await Promise.all(dependencies.map(dep => bundle_module(dep, output, root, options)))

  return result.outputs[0].path
}

// bundle_module('./node_modules/react-dom/cjs/react-dom.development.js')
// bundle_module('react/jsx-dev-runtime', path.resolve('./build'))

function get_dependencies(dependencies: Set<string>, transpiler: Transpiler, filepath: string) {
  const code = fs.readFileSync(filepath, 'utf-8')
  const imports = transpiler.scanImports(code)

  imports.forEach(({ path: import_path }) => {
    if (import_path.startsWith('.')) {
      // const absoluted = path.resolve(path.dirname(filepath), import_path)
      const resolved = import.meta.resolveSync(import_path, filepath)
      console.log(filepath, resolved)
      get_dependencies(dependencies, transpiler, resolved)
    }
    else {
      dependencies.add(import_path)
    }
  })

  return dependencies
}