import * as  path from 'path'
import * as fs from 'fs'
import * as sass from 'sass'
import { ModuleFile, ModuleType, create_module } from '../module_manager'
import { transform_css_content } from './css'
import { TransformResult } from '../transformer'

export function transform_scss(url: URL): TransformResult {
  const content = fs.readFileSync(url, 'utf-8')
  const result = sass.compileString(content, {
    sourceMap: true,
    sourceMapIncludeSources: true,
    importers: [
      {
        canonicalize(name) {
          console.log('sass:url', name)
          const fullpath = path.join(path.dirname(url.pathname), name)
          const modulepath = find_scss_file(fullpath)
          if(!modulepath) throw new Error('Not found')
          const modurl = Bun.pathToFileURL(modulepath)
          return modurl
        },
        load(url) {
          return {
            contents: fs.readFileSync(url, 'utf-8'),
            syntax: 'scss'
          };
        }
      },
    ]
  })

  const sourcemap = result.sourceMap!
  sourcemap.file = url.pathname

  const urls = result.loadedUrls.slice()
  urls.unshift(url)
  sourcemap.sources = sourcemap.sources.map((_, index) => {
    return urls[index].toString()
  })

  const css = transform_css_content(Buffer.from(result.css), url)
  return {
    module: css.module,
    deps: get_dependency_modules(result)
  }
}

function get_dependency_modules(result: sass.CompileResult) {
  const deps: Set<ModuleFile> = new Set
  result.loadedUrls.forEach(url => {
    deps.add(create_module(url, ModuleType.Style, '<null>'))
  })
  return deps
}

/**
 * find scss file by order:
 * 
 * 1. foo.scss
 * 2. foo.css
 * 3. _foo.scss
 * 4. _foo.css
 * 5. foo/index.scss
 * 6. foo/index.css
 * 7. foo/_index.scss
 * 8. foo/_index.css
 * 
 * @see https://sass-lang.com/documentation/at-rules/use/#finding-the-module
 */
function find_scss_file(filepath: string) {
  if(!path.isAbsolute(filepath)) throw new Error('path should be absoluted path')

  const dirpath = path.dirname(filepath)
  const basename = path.basename(filepath)
  if(basename !== path.basename(filepath, path.extname(filepath))) return filepath
  
  const find_paths = [
    filepath + '.scss',
    filepath + '.css',
    path.join(dirpath, '_' + basename + '.scss'),
    path.join(dirpath, '_' + basename + '.css'),
    path.join(dirpath, basename, 'index' + '.scss'),
    path.join(dirpath, basename, 'index' + '.css'),
    path.join(dirpath, basename, '_index' + '.scss'),
    path.join(dirpath, basename, '_index' + '.css'),
  ]

  for(let i = 0; i < find_paths.length; i++) {
    const target = find_paths[i]
    try {
      const stat = fs.statSync(target)
      if(stat.isFile()) return target
    }
    catch(error) {
      continue
    }
  }

  return null
}