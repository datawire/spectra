export type Callback = (path: string) => void;

export type FsWatchOptions = ({ type: 'polling'; interval?: number } | { type: 'native'; scope: 'dir' | 'file' }) & {
  signal: AbortSignal;
};

