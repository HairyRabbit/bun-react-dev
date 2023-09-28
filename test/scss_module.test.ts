import * as path from 'path'
import { test } from 'bun:test'
import { transform_scss, update_module_map_for_scss } from '../transformer/scss'
import { create_module } from '../module_manager'

test('transform scss', async () => {
  const file = Bun.file(path.join(__dirname, './scss_module/foo.scss'))
  const url = Bun.pathToFileURL(path.join(__dirname, './scss_module/foo.scss'))
  const result = await transform_scss(file)
  const map = new Map
  update_module_map_for_scss(map, create_module(url, file), result)
  console.log(result.sourcemap)
})