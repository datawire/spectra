import * as fs from 'node:fs/promises';
import * as timers from 'node:timers/promises';
import pollWatchFs from '../polling';
import { mkdtempWithFiles } from './__helpers__/mkdtemp';
import { race } from './__helpers__/race';

describe('pollingWatchFs', () => {
  it.concurrent('should call the callback when a file changes', async () => {
    const { files } = await mkdtempWithFiles();
    const callback = jest.fn();
    const controller = new AbortController();
    const options = {
      type: 'polling',
      interval: 50,
      signal: controller.signal,
    } as const;

    pollWatchFs([files[0]], options, callback);

    await fs.writeFile(files[0], 'new content');
    try {
      await race(150, controller, () => expect(callback).toHaveBeenCalledWith(files[0]));
    } finally {
      controller.abort();
    }
  });

  it.concurrent('should handle multiple paths', async () => {
    const { files } = await mkdtempWithFiles();
    const callback = jest.fn();
    const controller = new AbortController();
    const options = {
      type: 'polling',
      interval: 100,
      signal: controller.signal,
    } as const;

    pollWatchFs([files[0]], options, callback);

    try {
      await Promise.all([
        ...files.map(async file => fs.writeFile(file, 'new content')),
        race(1000, controller, () => expect(callback).toHaveBeenCalledWith(files[0])),
        race(1000, controller, () => expect(callback).toHaveBeenCalledWith(files[1])),
        race(1000, controller, () => expect(callback).toHaveBeenCalledWith(files[2])),
        race(1000, controller, () => expect(callback).toHaveBeenCalledWith(files[3])),
      ]);
    } finally {
      controller.abort();
    }
  });

  it.concurrent('should respect signal', async () => {
    const { files } = await mkdtempWithFiles();
    const callback = jest.fn();
    const controller = new AbortController();
    const options = {
      type: 'polling',
      interval: 50,
      signal: controller.signal,
    } as const;

    pollWatchFs([files[0]], options, callback);

    controller.abort();
    await fs.writeFile(files[0], 'new content');
    await timers.setTimeout(150);

    expect(callback).not.toHaveBeenCalled();
  });
});
