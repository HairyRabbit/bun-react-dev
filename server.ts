import * as fs from 'fs'
import * as path from 'path'
import { bundle_module } from './package_bundler';
import { transform_js } from './transformer/js';
import { render_html } from './html';
import { generate_boot_code } from './boot';
import { write_file } from './file';
import { BunFile } from 'bun';
import { watch } from 'chokidar'
import { ModuleFile, ModuleManager, ModuleType, create_module, create_module_manager, to_response } from './module_manager';
import { create_transform_factory } from './transformer';
import { transform_css_content } from './transformer/css';
import { generate_global_style_code } from './global_style';
import { generate_logo_code } from './logo';
import { Config } from './config';
import { pathToFileURL } from 'url';
import { create_watcher } from './wacher';

function serveFromDir(config: {
  directory: string;
  path: string;
}): Response | null {
  let basePath = path.join(config.directory, config.path);
  const suffixes = ["", ".html", "index.html"];

  for (const suffix of suffixes) {
    try {
      const pathWithSuffix = path.join(basePath, suffix);
      const stat = fs.statSync(pathWithSuffix);
      if (stat && stat.isFile()) {
        return new Response(Bun.file(pathWithSuffix));
      }
    } catch (err) { }
  }

  return null;
}

export type RequestHandler = {
  filter: string | RegExp,
  handler(filepath: string, workdir: string): Response | Promise<Response>,
}


export function create_server(project_path: string, config: Config) {
  if (!path.isAbsolute(project_path)) throw new Error('project_path should be a absolute path')

  const socket_topic = 'ws'
  const mm = create_module_manager()

  const watcher = create_watcher(config.workdir)
  const transform = create_transform_factory(mm, config.workdir)

  const server = Bun.serve({
    websocket: {
      open(ws) { ws.subscribe('hmr') },
      close(ws) { ws.unsubscribe('hmr') },
      message: (ws, message) => {},
    },
    async fetch(request, server) {
      const pathname = new URL(request.url).pathname

      if (pathname === '/') {
        return serve_module(
          '[html]', mm, () => {
            const filepath = path.join(config.workdir, 'index.html')
            const url = pathToFileURL(filepath)
            const mod = create_module(url, ModuleType.HTML, render_html())
            return mod
          }
        )
      }

      else if (pathname === '/[boot]') {
        return serve_module(
          '[boot]', mm, () => {
            const filepath = resolve_filepath('boot', config.workdir)
            if(filepath) {
              const url = pathToFileURL(filepath)
              const content = fs.readFileSync(url, 'utf-8')
              const mod = create_module(url, ModuleType.Code, content)
              return mod
            }
            else {
              const url = pathToFileURL('/[boot]')
              const mod = create_module(url, ModuleType.Code, generate_boot_code(config.workdir))
              return mod
            }
          }
        )
      }

      else if (pathname === '/[app]') {
        return serve_module(
          '[app]', mm, () => {
            const filepath = import.meta.resolveSync('App', config.workdir)
            const url = pathToFileURL(filepath)
            const mod = create_module(url, ModuleType.Code, generate_boot_code(config.workdir))
            return mod
          }
        )
      }

      // if (pathname === '/logo.svg') {
      //   const filename = 'logo.svg'
      //   const logo_filepath = path.resolve(output_dirpath, filename)
      //   let logo = cache.get(logo_filepath)
      //   if (undefined === logo) {
      //     const content = generate_logo_code()
      //     logo = await write_file(Bun.file(logo_filepath), content)
      //   }

      //   return new Response(logo)
      // }

      if (pathname.endsWith('/__REACT_DEV__')) {
        if (server.upgrade(request)) {
          return new Response("", {
            status: 101
          })
        }
      }


      const publicResponse = serveFromDir({
        directory: config.public,
        path: pathname === '/' ? '/index.html' : pathname,
      })

      if (publicResponse) return publicResponse


      if (pathname.startsWith('/[module]/')) {
        const module_name = pathname.replace(/^\/\[module\]\//, '')
        return serve_pkg(module_name, config.path.module, config.path.root)
      }

      const basename = pathname.replace(/^\//, '')
      const filepath = path.join(config.workdir, basename)
      const url = new URL(filepath, 'file:')
      const is_exists = fs.existsSync(url.pathname)
      if (false === is_exists) return new Response(null, {
        status: 404,
      })

      const transformed = await transform(url)
      const output_path = path.join(config.output_dirpath, basename)
      const output_file = await write_file(Bun.file(output_path), transformed)
      return new Response(output_file, {
        headers: {
          'Content-Type': 'application/javascript'
        }
      })
    }
  })

  function destroy() {
    server.stop()
  }

  function publish(data: string) {
    server.publish(socket_topic, data)
  }

  function create_handler(handlers: Set<RequestHandler>, final_handler: RequestHandler['handler'] | undefined) {
    function setup_handler(filter: RequestHandler['filter'], handler: RequestHandler['handler']): void
    function setup_handler(handler: RequestHandler['handler']): void
    function setup_handler(...args: any) {
      if(typeof args[0] === 'function') {
        final_handler = args[0]
      }
      else {
        handlers.add({ filter: args[0], handler: args[1] })
      }
    }

    return setup_handler
  }

  return {
    server,
    publish,
    destroy,
    get
  }

  // return {
  //   [Symbol.dispose]() {
  //     console.log('server destroy...')
  //     watcher.close()
  //     server.stop()
  //   }
  // }
}

async function serve_pkg(module_name: string, module_dir: string, root: string) {
  const output = await bundle_module(module_name, module_dir, root)
  if(null === output) return new Response(null, { status: 404 })
  return new Response(Bun.file(output))
}

function serve_module(module_id: string, module_manager: ModuleManager, get_module: (module_manager: ModuleManager) => ModuleFile) {
  let mod = module_manager.get_module(module_id)
  if(!mod) {
    mod = get_module(module_manager)
    module_manager.update(mod)
  }
  return to_response(mod)
}

async function serve_controlled(filepath: string | null, module_manager: ModuleManager, get_content: () => string, module_type: ModuleType = ModuleType.Code) {
  if(null === filepath) return new Response(null, { status: 404 })

  const url = pathToFileURL(filepath)

  let mod = module_manager.get_module_by_url(url)
  if(mod) return to_response(mod)

  const is_exists = fs.existsSync(url)
  
  let content: string
  if(is_exists) {
    content = fs.readFileSync(url, 'utf-8')
  }
  else {
    content = get_content()
  }

  mod = create_module(url, module_type, content)
  module_manager.update(mod)
  return to_response(mod)
}

function resolve_dirpath(dirpath: string | undefined, project_path: string, default_path: string) {
  if (undefined === dirpath) return path.join(project_path, default_path)
  if (path.isAbsolute(dirpath)) return dirpath
  return path.resolve(project_path, dirpath)
}

function sync_cache(cache: Map<string, BunFile>, dirpath: string) {
  const ls = fs.readdirSync(dirpath, { withFileTypes: true })
  ls.forEach(stat => {
    const target_path = path.join(dirpath, stat.name)
    if (stat.isDirectory()) {
      sync_cache(cache, target_path)
    }

    cache.set(target_path, Bun.file(target_path))
  })
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