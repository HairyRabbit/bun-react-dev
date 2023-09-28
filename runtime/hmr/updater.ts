import { context } from './context'

export async function update(id: string) {
  const mod = context.module.get(id)
  console.log(mod)

  if (!mod) {
    return false;
  }
  if (mod.is_declined) {
    return false;
  }

  const accepts = mod.accept_handlers
  const disposes = mod.dispose_handlers
  
  mod.dispose_handlers = []
  mod.data = {}

  disposes.map((callback) => callback())
  
  const timestamp = Date.now()
  for (const { deps: deps, callback: accpet } of accepts) {

    const [module, ...dependencies] = await Promise.all([
      import(id + `?mtime=${timestamp}`),
      ...deps.map((d) => import(d + `?mtime=${timestamp}`)),
    ])

    accpet({ module, deps: dependencies })
  }

  return true
}