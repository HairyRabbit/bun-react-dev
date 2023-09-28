import { BunFile } from "bun"

export type ModuleMap = Map<string, ModuleFile>

export type ModuleFile = {
  url: URL,
  file: BunFile,
  dependents: Set<string>,
  dependencies: Set<string>,
  replacement: boolean,
}

export function update_module(module_map: ModuleMap, module: ModuleFile, dependencies: Set<ModuleFile> = new Set) {
  const module_id = get_module_id(module)
  clean_module(module_map, module_id)

  module_map.set(module_id, module)
  dependencies.forEach(dependency => {
    const dependency_id = get_module_id(dependency)
    const dependency_module = module_map.get(dependency_id)

    if(!dependency_module) {
      module_map.set(dependency_id, dependency)
    }
    
    if(!dependency.dependents.has(module_id)) {
      dependency.dependents.add(module_id)
    }
  })
}

export function create_module(url: URL, file: BunFile, replacement: boolean = false): ModuleFile {
  return {
    url,
    file,
    dependencies: new Set,
    dependents: new Set,
    replacement,
  }
}

export function get_module_id(module: ModuleFile) {
  return module.url.toString()
}

function clean_module(module_map: ModuleMap, module_id: string) {
  const module = module_map.get(module_id)
  if(!module) return

  module.dependencies.forEach(module_map.delete.bind(module_map))
  module.dependents.forEach(dep_module_id => {
    const dep_module = module_map.get(dep_module_id)
    if(!dep_module) return
    dep_module.dependencies.delete(module_id)
  })
  module_map.delete(module_id)
}


export function get_replacement_modules(module_map: ModuleMap, module: ModuleFile): Set<ModuleFile> {
  const set: Set<ModuleFile> = new Set

  function lookup_replacement_modules(module: ModuleFile) {
    module.dependents.forEach(dependent_module_id => {
      const dependent_module = module_map.get(dependent_module_id)
      if(!dependent_module) throw new Error(`Module can not find, "${dependent_module_id}"`)
      if(dependent_module.replacement) {
        set.add(dependent_module)
      }
      else {
        lookup_replacement_modules(dependent_module)
      }
    })
  }

  lookup_replacement_modules(module)
  return set
}