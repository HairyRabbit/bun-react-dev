import { HotModule } from './module'
import { context } from './context'

export function register(url: string) {
  const id = new URL(url).pathname
  const module = context.module.get(id)
  if (module) {
    module.lock()
    // runModuleDispose(id);
    module.dispose_handlers.map(handler => handler())
    // return existing;
    return module
  }

  const created_module = HotModule.create(id)
  context.module.set(id, created_module)
  
  return created_module
}

globalThis.__DEV_HMR_REGISTER__ = register