import { setTimeout } from 'node:timers';
import type { Callback } from './types';

export function debounceCallback(callback: Callback, signal: AbortSignal): Callback {
  const state = new Map<string, NodeJS.Timeout>();
  signal.addEventListener(
    'abort',
    () => {
      for (const timeout of state.values()) {
        clearTimeout(timeout);
      }
    },
    { once: true }
  );

  return (path: string) => {
    const timeoutId = state.get(path);
    if (timeoutId !== void 0) {
      clearTimeout(timeoutId);
    }

    state.set(
      path,
      setTimeout(() => {
        callback(path);
        state.delete(path);
      }, 500)
    );
  };
}
