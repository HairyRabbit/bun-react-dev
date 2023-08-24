import { createElement, FunctionComponent, HTMLAttributes, PropsWithChildren, ReactNode } from "react"
import { renderToString } from 'react-dom/server'

type ContainerOptions<T extends HTMLElement> = {
  readonly id?: string,
  readonly tag?: T['tagName'],
  readonly attributes?: Omit<HTMLAttributes<T>, 'id'>
}

type HTMLProps<T extends HTMLElement> = {
  readonly container?: null | boolean | string | ContainerOptions<T>
}

export const HTML = function <T extends HTMLElement>(props: HTMLProps<T>): ReactNode {
  const container_options = make_container_options(props.container)

  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <link rel="icon" href="favicon.ico" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#000000" />
        <meta name="description" content="serve by react-dev" />
        {/* <link rel="manifest" href="/manifest.json" /> */}
        <title>React App</title>
        <meta name="react-dev" content="" />
      </head>
      <body>
        <noscript>You need to enable JavaScript to run this app.</noscript>
        {container_options && createElement(
          container_options.tag, 
          { 
            ...container_options.attributes,
            id: container_options.id, 
          }
        )}
        <script src="/boot.tsx" type="module"></script>
      </body>
    </html>
  )
}

export const DEFAULT_CONTAINER_ID = 'root'
export const DEFAULT_CONTAINER_TAGNAME = 'div'

export function make_container_options<T extends HTMLElement>(options: HTMLProps<T>['container']) {
  if (false === options) return null
  if (true === options || null === options || undefined === options) return {
    id: DEFAULT_CONTAINER_ID,
    tag: DEFAULT_CONTAINER_TAGNAME,
    attributes: {},
  }

  switch (typeof options) {
    case 'string': {
      return {
        id: options,
        tag: DEFAULT_CONTAINER_TAGNAME,
        attributes: {}
      }
    }
    case 'object': {
      return {
        id: options.id ?? DEFAULT_CONTAINER_ID,
        tag: options.tag ?? DEFAULT_CONTAINER_TAGNAME,
        attributes: options.attributes ?? {}
      }
    }
    default: return null
  }
}

export function render_html<T extends HTMLElement>(props: HTMLProps<T> = {}) {
  return renderToString(<HTML {...props} />)
}