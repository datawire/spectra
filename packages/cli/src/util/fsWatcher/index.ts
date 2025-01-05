import { isAbsolute, join } from 'node:path';
import { debounceCallback } from './debounceCallback';
import type { Callback, FsWatchOptions } from './types';
import pollWatchFs from './implementations/polling';
import nativeWatchFs from './implementations/native';

export type { Callback, FsWatchOptions };

export async function watchFs(
  cwd: string,
  paths: readonly string[],
  options: FsWatchOptions,
  callback: Callback
): Promise<void> {
  const debouncedCallback = debounceCallback(callback, options.signal);
  const absolutePaths = paths.map(path => (isAbsolute(path) ? path : join(cwd, path)));

  if (options.type === 'polling') {
    pollWatchFs(absolutePaths, options, debouncedCallback);
  } else {
    await nativeWatchFs(absolutePaths, options, debouncedCallback);
  }
}
