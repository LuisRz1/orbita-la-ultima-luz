// Debug surface for manual tuning and deterministic browser tests. Only exposed when the URL has ?debug.

export type DebugApi = Record<string, (...args: never[]) => unknown>;

declare global {
  interface Window { __orbita?: DebugApi }
}

export const debugEnabled = () => new URLSearchParams(window.location.search).has('debug');

/** Adds functions to `window.__orbita`. Returns a cleanup that removes exactly what it added. */
export function exposeDebug(api: DebugApi): () => void {
  if (!debugEnabled()) return () => {};
  const target = (window.__orbita ??= {});
  Object.assign(target, api);
  return () => { for (const key of Object.keys(api)) if (target[key] === api[key]) delete target[key]; };
}
