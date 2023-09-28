import * as path from 'path'
import { BunFile } from "bun";
import { ModuleMap, create_module, update_module } from "./module_manager";
import { transform_js, transform_js_file } from './transformer/js'
import { transform_scss, update_module_map_for_scss } from './transformer/scss'
import { generate_style_code, transform_css_content, transform_css_file } from './transformer/css';

class TransformError extends Error {}

export type TransformContext = {
  module_map: ModuleMap,
  source_dirpath: URL
}

export function create_transform_factory(module_map: ModuleMap, source_dirpath: string) {
  const context = {
    module_map,
    source_dirpath,
  }

  return async (url: URL) => {
    const file = Bun.file(url.pathname)
    const filepath = url.href
    const extname = path.extname(filepath)
    console.log('file:type', extname, file.type)

    switch(extname) {
      case '.ts':
      case '.tsx':
      case '.js':
      case '.jsx': {
        const code = transform_js_file(file, source_dirpath)
        update_module(module_map, create_module(url, file, true)) // @TODO
        return code
      }
      case '.scss': {
        const result_scss = await transform_scss(file)
        update_module_map_for_scss(module_map, create_module(url, file, true), result_scss)
        const result_css = transform_css_content(result_scss.css, file.name!)
        const code = generate_style_code(result_css.code.toString(), result_css.css_exports, result_css.sourcemap)
        return code
      }
      case '.css': {
        const result_css = await transform_css_file(file)
        update_module(module_map, create_module(url, file, true))
        const code = generate_style_code(result_css.code.toString(), result_css.css_exports, result_css.sourcemap)
        return code
      }
      default: {
        const content = await file.text()
        return content
      }
    }
  }
}