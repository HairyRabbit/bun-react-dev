import type { HotModule } from "./runtime/hmr/module"

declare global {
  var __DEV_SOCKET__: WebSocket
  var __DEV_HMR_REGISTER__: (url: string) => HotModule
}