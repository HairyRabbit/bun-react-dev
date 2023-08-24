import * as path from 'path'
import * as fs from 'fs'
import { BunFile } from 'bun'

export async function write_file(file: BunFile, content: string) {
  // if(!path.isAbsolute(filepath)) throw new Error('filepath should be absolute path')
  const filepath = file.name
  if(undefined === filepath) throw new Error('No path found')
  const dirpath = path.dirname(filepath)
  fs.mkdirSync(dirpath, { recursive: true })

  await Bun.write(file, content)
  return file
}

const resolve = import.meta.resolveSync
export function resolve_filepath(...args: Parameters<typeof resolve>) {
  try {
    return resolve(...args)
  }
  catch(err) {
    return null
  }
}