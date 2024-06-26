import * as path from 'path'
import { test } from 'bun:test'
import { transform_scss, get_dependency_modules } from '../transformer/scss'
import { create_module } from '../module_manager'

test('transform scss', async () => {
  const file = Bun.file(path.join(__dirname, './scss_module/foo.scss'))
  const url = Bun.pathToFileURL(path.join(__dirname, './scss_module/foo.scss'))
  const result = await transform_scss(file)
  const map = new Map
  get_dependency_modules(map, create_module(url, file), result)
  console.log(result.sourcemap)
})