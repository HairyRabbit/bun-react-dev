import { test } from 'bun:test'
import * as path from 'path'
import { pathToFileURL } from 'url'

test('file type', async () => {
  const file = Bun.file('./foo.tsx?bar=42.css')
  console.log(file, file.name, file.type)
})

test('url path', async () => {
  const url = new URL('/foo.tsx?bar=42', 'file:')
  const bun_url = Bun.pathToFileURL('/foo.tsx?bar=42')
  console.log(bun_url)
})