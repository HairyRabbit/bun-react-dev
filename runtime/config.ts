/// <reference types="web" />

const ConfigName = 'react-dev'

export function get_config_from_node() {
  if(!globalThis.document) return null
  
  const metas = globalThis.document.head.getElementsByTagName('meta')
  for(const meta of metas) {
    const name = meta.getAttribute('name')
    if(ConfigName === name) {
      const raw = meta.getAttribute('content')
      if(raw) {
        return JSON.parse(window.atob(raw))
      }
    }
  }

  return null
}


export type Config = {
  namespace?: string,
  endpoint?: string,
}

export const DefaultConfig: Required<Config> = {
  namespace: '__REACT_DEV__',
  endpoint: '__REACT_DEV__'
}