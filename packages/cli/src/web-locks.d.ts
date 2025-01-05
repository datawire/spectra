declare module 'web-locks' {
  export const locks: globalThis.LockManager;
  export const AbortController: typeof globalThis.AbortController;
}
