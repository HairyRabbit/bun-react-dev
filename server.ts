import * as fs from 'fs'
import * as path from 'path'
import { bundle_module } from './package_bundler';
import { transform_js } from './transformer/js';
import { render_html } from './html';
import { generate_boot_code } from './boot';
import { write_file } from './file';
import { BunFile } from 'bun';
import { watch } from 'chokidar'
import { ModuleFile, ModuleMap, get_replacement_modules } from './module_manager';
import { create_transform_factory } from './transformer';

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

export type ServerOptions = {
  path: {
    public: string
    module: string
    output: string
    root: string
  }
  entry?: string,
  socket_path?: string,

  html?: {},
  boot?: {},
  outdir?: string
  srcdir?: string
  cache?: boolean | string
}

const DEFAULT_OUTDIR = 'target'
const DEFAULT_SRCDIR = 'src'

export function create_server(project_path: string, options: ServerOptions) {
  if (!path.isAbsolute(project_path)) throw new Error('project_path should be a absolute path')
  const source_dirpath = resolve_dirpath(options.srcdir, project_path, DEFAULT_SRCDIR)
  const output_dirpath = resolve_dirpath(options.outdir, project_path, DEFAULT_OUTDIR)

  const module_map: ModuleMap = new Map

  const cache: Map<string, BunFile> = new Map
  const depmap: Map<string, string> = new Map
  // fs.existsSync(output_dirpath) && sync_cache(cache, output_dirpath)

  const watcher = watch(source_dirpath, { alwaysStat: true })
  const transform = create_transform_factory(module_map, source_dirpath)

  watcher.on('change', (filepath, stat) => {
    console.log('file change:', filepath)
    const url = Bun.pathToFileURL(filepath)
    
    const module_file = module_map.get(url.toString())
    if(!module_file) return

    console.log('file module:', module_file)

    if(module_file.replacement) {
      const relative_path = path.relative(source_dirpath, filepath)
      const runtime_filepath = '/' + relative_path
      server.publish('hmr', JSON.stringify({
        type: 'update',
        payload: {
          url: runtime_filepath
        }
      }))
    }
    else {
      const dependents = get_replacement_modules(module_map, module_file)
      dependents.forEach(dependent_module => {
        const relative_path = path.relative(source_dirpath, dependent_module.url.pathname)
        const runtime_filepath = '/' + relative_path
        server.publish('hmr', JSON.stringify({
          type: 'update',
          payload: {
            url: runtime_filepath
          }
        }))
      })
    }



    // const bubbled_path = module_map.get(url.toString()) ?? filepath
    // const relative_path = path.relative(source_dirpath, bubbled_path)
    // // const output_path = path.join(relative_path, relative_path)
    // // cache.set(output_path, Bun.file(output_path))

    // const runtime_filepath = '/' + relative_path
    // server.publish('hmr', JSON.stringify({
    //   type: 'update',
    //   payload: {
    //     url: runtime_filepath
    //   }
    // }))
  }).on('add', (filepath, stat) => {
    const relative_path = path.relative(source_dirpath, filepath)

    if (stat && stat.size > 0) {
      if (['index.html'].includes(relative_path)) {
        const output_path = path.join(output_dirpath, relative_path)
        cache.set(output_path, Bun.file(filepath))
      }
    }
  }).on('unlink', (filepath) => {
    const relative_path = path.relative(source_dirpath, filepath)

    if (relative_path === 'index.html') {
      const output_path = path.join(output_dirpath, relative_path)
      cache.delete(output_path)
    }

    console.log(`File ${filepath} has been removed`)
  })

  const html_rewrite = new HTMLRewriter()
  html_rewrite.on('head', {
    element(el) {
      const content = JSON.stringify({
        server: {
          development: server.development,
          host: server.hostname,
          port: server.port,
        },
        socket: {
          endpoint: '__DEV__',
        },
        namespace: '__REACT_DEV__'
      })
      el.append(`<meta name="react-dev" content="${Buffer.from(content).toString('base64')}">`, { html: true })
    }
  })

  const server = Bun.serve({
    websocket: {
      open: (ws) => {
        console.log("Client connected");
        // console.log(ws)
        // ws.send('ok')
        ws.subscribe('hmr')

      },
      message: (ws, message) => {
        console.log("Client sent message", message);
      },
      close: (ws) => {
        console.log("Client disconnected");
        ws.unsubscribe('hmr')
      },
    },
    async fetch(request, server) {
      const pathname = new URL(request.url).pathname
      console.log(pathname)

      if (pathname === '/') {
        const html_filepath = path.resolve(output_dirpath, 'index.html')
        // const html = Bun.file(html_filepath)

        let html = cache.get(html_filepath)
        if (undefined === html) {
          const content = render_html()
          html = await write_file(Bun.file(html_filepath), content)
        }

        return new Response(html)
      }

      if (pathname === '/boot.tsx') {
        const boot_filepath = path.resolve(output_dirpath, 'boot.tsx')
        let boot = cache.get(boot_filepath)
        if (undefined === boot) {
          const content = generate_boot_code()
          const transformed = transform_js(content, source_dirpath, 'boot.tsx')
          boot = await write_file(Bun.file(boot_filepath), transformed)
        }

        return new Response(boot)
      }

      if (pathname.endsWith('/__REACT_DEV__')) {
        if (server.upgrade(request)) {
          return new Response("", {
            status: 101
          })
        }
      }


      const publicResponse = serveFromDir({
        directory: options.path.public,
        path: pathname === '/' ? '/index.html' : pathname,
      })

      if (publicResponse) {
        if (pathname === '/') {
          const resp = html_rewrite.transform(
            new Response(`
<!DOCTYPE html>
<html>
<!-- comment -->
<head>
  <title>My First HTML Page</title>
</head>
<body>
  <h1>My First Heading</h1>
  <p>My first paragraph.</p>
</body>
`)
          )
          console.log(await resp.text())
        }
        return publicResponse
      }


      if (pathname.startsWith('/[module]/')) {
        const module_name = pathname.replace(/^\/\[module\]\//, '')
        return serve_module(module_name, options.path.module, options.path.root)
      }

      const basename = pathname.replace(/^\//, '')
      const filepath = path.join(source_dirpath, basename)
      const url = new URL(filepath, 'file:')
      const is_exists = fs.existsSync(url.pathname)
      if (false === is_exists) return new Response(null, {
        status: 404,
      })

      const transformed = await transform(url)
      const output_path = path.join(output_dirpath, basename)
      const output_file = await write_file(Bun.file(output_path), transformed)
      return new Response(output_file, {
        headers: {
          'Content-Type': 'application/javascript'
        }
      })
    }
  })

  function destroy() {
    console.log('server destroy...')
    watcher.close()
    server.stop()
  }

  return destroy

  // return {
  //   [Symbol.dispose]() {
  //     console.log('server destroy...')
  //     watcher.close()
  //     server.stop()
  //   }
  // }
}

// process.on('SIGQUIT', () => {})

async function serve_module(module_name: string, module_dir: string, root: string) {
  const output = await bundle_module(module_name, module_dir, root)
  if(null === output) return new Response(null, { status: 404 })
  return new Response(Bun.file(output))
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