/// <reference types="web" />

import { injectIntoGlobalHook } from 'react-refresh/runtime'

declare global {
  function $RefreshReg$(): void
  function $RefreshSig$(): <T>(type: T) => T
}

injectIntoGlobalHook(window)
globalThis.$RefreshReg$ = () => { };
globalThis.$RefreshSig$ = () => (type) => type;