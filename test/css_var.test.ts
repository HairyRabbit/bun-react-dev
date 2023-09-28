import * as path from 'path'
import { test } from 'bun:test'
import * as lightningcss from 'lightningcss'
import { transform_scss, update_module_map_for_scss } from '../transformer/scss'

test.only('transform css', async () => {
  const transformed = lightningcss.transform({
    filename: path.join(__dirname, './scss_module/foo.scss'),
    cssModules: true,
    code: Buffer.from('@var foo: red;.test { color: red; }'),
    sourceMap: true,
  })
})