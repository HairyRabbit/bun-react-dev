import { context } from './context'

export async function update(id: string) {
  const state = context.module.get(id)
  console.log(state)

  if (!state) {
    return false;
  }
  if (state.is_declined) {
    return false;
  }

  const accepts = state.accept_handlers
  const disposes = state.dispose_handlers
  
  state.dispose_handlers = []
  state.data = {}

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