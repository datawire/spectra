import type { WatchOptions } from 'node:fs';
import { type FileChangeInfo, watch } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import type { Callback, FsWatchOptions } from '../types';

async function nativeWatch(path: string, options: WatchOptions, callback: (event: FileChangeInfo<string>) => void) {
  try {
    const watcher = watch(path, options);
    for await (const event of watcher) {
      callback(event);
    }
  } catch (err) {
    if (!(err instanceof Error) || err.name !== 'AbortError') {
      throw err;
    }
  }
}

async function nativeWatchFsDir(paths: readonly string[], callback: Callback, options: WatchOptions) {
  const filesInDir = new Map<string, Set<string>>();
  const promises: Promise<void>[] = [];

  for (const path of paths) {
    const dir = dirname(path);
    const files = filesInDir.get(dir);
    if (files !== void 0) {
      files.add(path);
      continue;
    }

    filesInDir.set(dir, new Set([path]));
    promises.push(
      nativeWatch(dir, options, event => {
        if (event.eventType !== 'change') return;
        if (event.filename === null) return;
        const files = filesInDir.get(dir);
        const filepath = join(dir, event.filename);
        if (files?.has(filepath)) {
          callback(filepath);
        }
      })
    );
  }

  await Promise.all(promises);
}

async function nativeWatchFsFile(paths: readonly string[], callback: Callback, options: WatchOptions) {
  const promises: Promise<void>[] = [];

  for (const path of paths) {
    promises.push(
      nativeWatch(path, options, event => {
        if (event.eventType === 'change') {
          callback(path);
        }
      })
    );
  }

  await Promise.all(promises);
}

export default async function nativeWatchFs(
  paths: readonly string[],
  { scope, signal }: FsWatchOptions & { type: 'native' },
  callback: Callback
): Promise<void> {
  if (scope === 'dir') {
    return nativeWatchFsDir(paths, callback, { signal });
  } else {
    return nativeWatchFsFile(paths, callback, { signal });
  }
}
