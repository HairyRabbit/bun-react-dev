import { injectIntoGlobalHook } from 'react-refresh/runtime'

declare global {
  function $RefreshReg$(): void
  function $RefreshSig$(): <T>(type: T) => T
}

injectIntoGlobalHook(globalThis as unknown as Window)
globalThis.$RefreshReg$ = () => { };
globalThis.$RefreshSig$ = () => (type) => type;