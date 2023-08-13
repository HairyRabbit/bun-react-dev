import * as fs from 'fs'
import * as path from 'path'
import { bundle_module } from './module_bundler';
import { transform_js } from './loader/js';
import { transform_css } from './loader/css';

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
  socket_path?: string
}

export function create_server(options: ServerOptions) {
  const watcher = fs.watch(options.path.root)
  const cache: Map<string, string> = new Map
  watcher.addListener('change', (type, filename) => {
    console.log(type, filename)
    const runtime_filepath = '/' + filename
    if('change' === type) {
      server.publish('hmr', JSON.stringify({
        type: 'update',
        payload: {
          url: runtime_filepath
        }
      }))
    }
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
      el.append(`<meta name="react-dev" content="${Buffer.from(content).toString('base64')}">`, {html: true})
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
      
      if(pathname === '/') {
        // const html = fs.readFileSync(path.resolve(options.path.public, 'index.html'), 'utf-8')
        // return html_rewrite.transform(new Response(html, {
        //   headers: {
        //     'Content-Type': 'text/html'
        //   }
        // }))
        return new Response(Bun.file(path.resolve(options.path.public, 'index.html')))
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
        path: pathname === '/' ? '/index.html': pathname,
      })
      if (publicResponse) {
        if(pathname === '/') {
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


      if(pathname.startsWith('/[module]/')) {
        const module_name = pathname.replace(/^\/\[module\]\//, '')
        return serve_module(module_name, options.path.module, options.path.root)
      }

      const filepath = path.resolve(options.path.root, pathname.replace(/^\//, ''))
      if(false === fs.existsSync(filepath)) {
        return new Response("File not found", {
          status: 404,
        })
      }

      const ext = path.extname(pathname)
      switch(ext) {
        case '.ts':
        case '.tsx': 
        case '.js': 
        case '.jsx': {
          const content = fs.readFileSync(filepath, 'utf-8')
          const result = transform_js(content, options.path.root, pathname.replace(/^\//, ''))
          const outpath = path.resolve(options.path.output, pathname.replace(/^\//, '').replace(ext, '.js'))
          fs.writeFileSync(outpath, result)
          cache.set(filepath, result)
          return new Response(Bun.file(outpath))
        }
        case '.css':
          const content = fs.readFileSync(filepath, 'utf-8')
          const result = transform_css(content, options.path.root, pathname.replace(/^\//, ''))
          const outpath = path.resolve(options.path.output, pathname.replace(/^\//, '').replace(ext, ext + '.js'))
          fs.writeFileSync(outpath, result)
          cache.set(filepath, result)
          return new Response(Bun.file(outpath))
        default: {
          // raw-loader
          return new Response(Bun.file(filepath))
        }
      }
    }
  })

  return server
}

async function serve_module(module_name: string, module_dir: string, root: string) {
  const output = await bundle_module(module_name, module_dir, root)
  return new Response(Bun.file(output))
}