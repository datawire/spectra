import { mkdir, mkdtemp, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

export async function mkdtempWithFiles() {
  const dir = await mkdtemp(join(tmpdir(), 'spectra-fs-watcher-'));

  await Promise.all([
    writeFile(join(dir, 'file-1'), 'content'),
    writeFile(join(dir, 'file-2'), 'content'),
    mkdir(join(dir, 'dir-1')).then(() =>
      Promise.all([
        writeFile(join(dir, 'dir-1', 'file-1'), 'content'),
        writeFile(join(dir, 'dir-1', 'file-2'), 'content'),
      ])
    ),
  ]);

  return {
    cwd: dir,
    files: [join(dir, 'file-1'), join(dir, 'file-2'), join(dir, 'dir-1', 'file-1'), join(dir, 'dir-1', 'file-2')],
  };
}
