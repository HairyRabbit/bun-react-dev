import type { HotModule } from './module'

export type Context = {
  module: Map<string, HotModule>
}

export const context: Context = {
  module: new Map
}