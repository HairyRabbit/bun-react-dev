import * as fs from 'fs'
import * as path from 'path'
import * as toml from 'toml'

export type Config = {
  workdir: string,
  gendir: string,
  pkgdir: string,
}

export const DEFAULT_CONFIG: Config = {
  workdir: './src',
  gendir: './target/gen',
  pkgdir: './target/pkg',
}

export function get_config(rootdir: string) {
  const merge = create_merge_config(DEFAULT_CONFIG, rootdir)

  const filepaths = [
    path.join(rootdir, 'project.toml'),
    path.join(rootdir, 'project.json'),
  ]

  for (const filepath of filepaths) {
    const is_exists = fs.existsSync(filepath)
    if(false === is_exists) continue

    const extname = path.extname(filepath)
    const content = fs.readFileSync(filepath, 'utf-8')
    switch(extname) {
      case '.toml': return merge(toml.parse(content))
      case '.json': return merge(JSON.parse(content))
      default: return merge()
    }
  }

  const pkgcfg_path = path.join(rootdir, 'package.json')
  const is_pkgcfg_exists = fs.existsSync(pkgcfg_path)
  if(false === is_pkgcfg_exists) return merge()

  const pkgcfg = JSON.parse(fs.readFileSync(pkgcfg_path, 'utf-8'))
  if(!pkgcfg.package) return merge()

  return merge(pkgcfg.package)
}


function create_merge_config(default_config: Config, rootdir: string) {
  function merge_config(user_config?: Partial<Config>): Config {
    if(!user_config) return default_config

    return {
      workdir: path.join(rootdir, user_config.workdir ?? default_config.workdir),
      gendir: path.join(rootdir, user_config.gendir ?? default_config.gendir),
      pkgdir: path.join(rootdir, user_config.pkgdir ?? default_config.pkgdir),
    }
  }

  return merge_config
}