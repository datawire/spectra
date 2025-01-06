import * as fs from 'node:fs/promises';
import nativeWatchFs from '../native';
import { mkdtempWithFiles } from './__helpers__/mkdtemp';
import { race } from './__helpers__/race';

describe('nativeWatchFs', () => {
  describe.each(['dir', 'file'] as const)('given %s scope', scope => {
    it.concurrent('should call the callback when a file changes', async () => {
      const { files } = await mkdtempWithFiles();
      const callback = jest.fn();
      const controller = new AbortController();
      const options = {
        type: 'native',
        scope,
        signal: controller.signal,
      } as const;

      const watch = nativeWatchFs([files[0]], options, callback);

      await fs.writeFile(files[0], 'new content');
      try {
        await race(1000, controller, () => expect(callback).toHaveBeenCalledWith(files[0]));
      } finally {
        controller.abort();
      }

      await expect(watch).resolves.toBeUndefined();
    });

    it.concurrent('should handle multiple paths', async () => {
      const { files } = await mkdtempWithFiles();
      const callback = jest.fn();
      const controller = new AbortController();
      const options = {
        type: 'native',
        scope,
        signal: controller.signal,
      } as const;

      const watch = nativeWatchFs(files, options, callback);

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

      expect(watch).resolves.toBeUndefined();
    });
  });
});
