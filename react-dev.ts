import { EventEmitter } from 'events'
import { Config, get_config } from './config'
import { create_server } from './server'
import { create_watcher } from './wacher'
import { create_module_manager } from './module_manager'

export function create_react_dev(rootdir: string) {
  const context = {}
  const cfg = get_config(rootdir)

  const mm = create_module_manager()
  const server = create_server(rootdir, cfg)
  const watcher = create_watcher(cfg.workdir)

  watcher.change(/^boot\.(j|t)sx?$/, () => {
    
    return false
  })

  watcher.change(filepath => {
    const mod = mm.get_module(filepath)
    if(!mod)return

    const updates: Set<string> = new Set

    if(mod.replacement) {
      updates.add(filepath)
    }
    else {
      const dependents = mm.get_replacement_modules(mod)
      dependents.forEach(dependent_module => {
        updates.add(dependent_module.path)
      })
    }

    if(updates.size) {
      updates.forEach(url => {
        server.publish('hmr', JSON.stringify({
          type: 'hmr.update',
          payload: {
            url
          }
        }))
      })
    }
  })

  return
}