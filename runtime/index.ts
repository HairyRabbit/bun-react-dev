import { Config, DefaultConfig } from './config'
import { create_socket } from './socket'
import { mount_hmr_socket_handler } from './hmr/socket_handler'
import { register } from './hmr/register'
import * as react_refresh from './react_refresh'
// import { error } from './logger'

if (globalThis.location) {
  const config = { ...DefaultConfig }
  const url = new URL(globalThis.location as any)
  url.protocol = url.protocol.replace('http', 'ws')
  const socket = create_socket(new URL(config.endpoint, url))
  mount_hmr_socket_handler(socket)

  const runtime = {
    socket,
    react_refresh,
    hmr: {
      register,
    }
  }

  // @ts-ignore
  globalThis[config.namespace] = runtime
}