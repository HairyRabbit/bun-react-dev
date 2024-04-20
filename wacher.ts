import { pathToFileURL } from "bun"
import { watch } from "chokidar"
import * as path from "path"

const enum WatchHandlerType { Change, Remove }

type WatcherHandler = {
  type: WatchHandlerType,
  filter: string | RegExp,
  handler(filepath: string, workdir: string): any | Promise<any>,
}

export function create_watcher(workdir: string) {
  const watcher = watch(workdir, { alwaysStat: true })
  
  const change_handlers: Set<WatcherHandler> = new Set()
  const remove_handlers: Set<WatcherHandler> = new Set()
  let final_change_handler: WatcherHandler['handler'] | undefined = undefined
  let final_remove_handler: WatcherHandler['handler'] | undefined = undefined

  function create_watch_handler(handler_type: WatchHandlerType, handlers: Set<WatcherHandler>, final_handler: WatcherHandler['handler'] | undefined) {
    return async (filepath: string) => {
      const relative_path = path.relative(workdir, filepath)
      for (const { type, filter, handler } of handlers) {
        if(handler_type !== type) {
          continue
        }

        if(
          (typeof filter === 'string' && relative_path === filter) || 
          (filter instanceof RegExp && filter.test(relative_path))
        ) {
          const result = await handler(relative_path, workdir)
          if(false === Boolean(result)) return
        }
      }

      if(final_handler) {
        final_handler(relative_path, workdir)
      }
    }
  }

  const watch_change_handler = create_watch_handler(WatchHandlerType.Change, change_handlers, final_change_handler)
  const watch_remove_handler = create_watch_handler(WatchHandlerType.Remove, remove_handlers, final_remove_handler)

  watcher
    .on('change', watch_change_handler)
    .on('add', async (filepath, stat) => {
      if (stat && stat.size > 0) {
        return watch_change_handler(filepath)
      }
    })
    .on('unlink', watch_remove_handler)

  function destroy() {
    watcher.close()
  }

  function create_handler(handler_type: WatchHandlerType, handlers: Set<WatcherHandler>, final_handler: WatcherHandler['handler'] | undefined) {
    function setup_handler(filter: WatcherHandler['filter'], handler: WatcherHandler['handler']): void
    function setup_handler(handler: WatcherHandler['handler']): void
    function setup_handler(...args: any) {
      if(typeof args[0] === 'function') {
        final_handler = args[0]
      }
      else {
        handlers.add({ type: handler_type, filter: args[0], handler: args[1] })
      }
    }

    return setup_handler
  }

  return {
    destroy,

    change: create_handler(WatchHandlerType.Change, change_handlers, final_change_handler),
    remove: create_handler(WatchHandlerType.Remove, remove_handlers, final_remove_handler),
  }
}