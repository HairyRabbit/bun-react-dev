export type ModuleMap = Map<string, ModuleFile>

export const enum ModuleType {
  Code,
  Style,
  Config,
  Asset,
  HTML,
}

export type ModuleFile = {
  id: string,
  type: ModuleType,
  path: string,
  content: string,
  dependents: Set<string>,
  dependencies: Set<string>,
  replacement: boolean,
}

export type ModuleManager = ReturnType<typeof create_module_manager>

export function create_module_manager() {
  const module_map: ModuleMap = new Map

  function get_module(id: string) {
    return module_map.get(id)
  }

  function delete_module(module_id: string) {
    const module = module_map.get(module_id)
    if (!module) return
  
    module.dependencies.forEach(module_map.delete.bind(module_map))
    module.dependents.forEach(dep_module_id => {
      const dep_module = module_map.get(dep_module_id)
      if (!dep_module) return
      dep_module.dependencies.delete(module_id)
    })
    module_map.delete(module_id)
  }

  function update_module(module: ModuleFile, dependencies: Set<ModuleFile> = new Set) {
    delete_module(module.id)

    module_map.set(module.id, module)
    dependencies.forEach(dependency => {
      const dependency_module = module_map.get(dependency.id)

      if (!dependency_module) {
        module_map.set(dependency.id, dependency)
      }

      if (!dependency.dependents.has(module.id)) {
        dependency.dependents.add(module.id)
      }
    })
  }

  

  function get_replacement_modules(module: ModuleFile): Set<ModuleFile> {
    const set: Set<ModuleFile> = new Set
  
    function recur(module: ModuleFile) {
      module.dependents.forEach(dependent_module_id => {
        const dependent_module = module_map.get(dependent_module_id)
        if (!dependent_module) throw new Error(`Module can not find, "${dependent_module_id}"`)
        if (dependent_module.replacement) {
          set.add(dependent_module)
        }
        else {
          recur(dependent_module)
        }
      })
    }
  
    recur(module)
    return set
  }

  return {
    delete: delete_module,
    update: update_module,
    
    get_replacement_modules,
    get_module,
  }
}


export function create_module(id: string, path: string, type: ModuleType, content: string, replacement: boolean = false): ModuleFile {
  return {
    id,
    type,
    path,
    content,
    dependencies: new Set,
    dependents: new Set,
    replacement,
  }
}

export function to_response(module: ModuleFile) {
  const type = to_mime_type(module)
  const blob = new Blob([module.content], type ? { type }: undefined)
  return new Response(blob)
}

function to_mime_type(module: ModuleFile) {
  switch(module.type) {
    case ModuleType.Code: 
    case ModuleType.Style: 
    case ModuleType.Asset: return 'application/javascript'
    case ModuleType.HTML: return 'text/html'
    case ModuleType.Config: return 'application/json'
  }
}