import { type StatsListener, unwatchFile, watchFile } from 'node:fs';

import type { Callback, FsWatchOptions } from '../types';

export default function pollWatchFs(
  paths: readonly string[],
  { signal, ...opts }: FsWatchOptions & { type: 'polling' },
  callback: Callback
) {
  const listeners = new Map<string, StatsListener>();

  for (const path of paths) {
    const listener: StatsListener = (curr, prev) => {
      if (curr.mtimeMs !== prev.mtimeMs) {
        callback(path);
      }
    };

    listeners.set(path, listener);
    watchFile(path, opts, listener);
  }

  signal.addEventListener(
    'abort',
    () => {
      for (const [path, listener] of listeners) {
        unwatchFile(path, listener);
      }
    },
    { once: true }
  );
}
