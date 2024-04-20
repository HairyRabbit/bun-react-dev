import * as fs from 'fs'
import * as path from 'path'
import { ModuleFile, ModuleManager, ModuleMap } from "./module_manager";
import { transform_js_file } from './transformer/js'
import { transform_scss } from './transformer/scss'
import { transform_css_file } from './transformer/css';

class TransformError extends Error {}

export type TransformResult = {
  module: ModuleFile
  deps?: Set<ModuleFile>
}

export type TransformContext = {
  module_map: ModuleMap,
  source_dirpath: URL
}

export function create_transform_factory(module_manager: ModuleManager, workdir: string) {
  return async (url: URL) => {
    const filepath = url.href
    const extname = path.extname(filepath)

    switch(extname) {
      case '.ts':
      case '.tsx':
      case '.js':
      case '.jsx': {
        const rst = transform_js_file(url, workdir)
        module_manager.update(rst.module, rst.deps) // @TODO
        return rst.module.content
      }
      case '.scss': {
        const rst = transform_scss(url)
        module_manager.update(rst.module, rst.deps)
        return rst.module.content
      }
      case '.css': {
        const rst = transform_css_file(url)
        module_manager.update(rst.module)
        return rst.module.content
      }
      default: {
        const content = fs.readFileSync(url, 'utf-8')
        return content
      }
    }
  }
}