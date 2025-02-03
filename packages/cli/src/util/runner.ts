import type { IPrismHttpServer } from '@stoplight/prism-http-server/src/types';
import * as process from 'process';
import { join, isAbsolute } from 'path';
import { locks } from 'web-locks';
import { CreateMockServerOptions } from './createServer';
import { getHttpOperationsFromSpec } from '@stoplight/prism-http';
import { safeApplyConfig } from './config';
import { disposeHandlers, type Observable, observable } from './observable';
import { type FsWatchOptions, watchFs } from './fsWatcher/index';
import { readDocument } from './readDocument';

export type CreatePrism = (options: Observable<CreateMockServerOptions>) => Promise<IPrismHttpServer | void>;

function resolveConfigPath(config: string | undefined): string | undefined {
  return config === void 0 || isAbsolute(config) ? config : join(process.cwd(), config);
}

export async function runPrismAndSetupWatcher(
  createPrism: CreatePrism,
  options: CreateMockServerOptions,
  signal: AbortSignal
): Promise<IPrismHttpServer | void> {
  const observableOptions = observable({ ...options });
  const possibleServer = await createPrism(observableOptions);
  if (!possibleServer) {
    return;
  }

  const configPath = resolveConfigPath(options.config);
  if (configPath !== void 0) {
    await safeApplyConfig(possibleServer.logger, options, observableOptions, configPath);
  }

  let server: IPrismHttpServer = possibleServer;

  if (!options.watch) {
    return server;
  }

  const watchOptions: FsWatchOptions =
    options.watchStrategy === 'polling'
      ? {
          type: 'polling',
          signal,
        }
      : {
          type: 'native',
          scope: options.watchStrategy === 'native-file' ? 'file' : 'dir',
          signal,
        };

  const files = [options.document, configPath].filter(Boolean) as readonly string[];

  void watchFs(process.cwd(), files, watchOptions, async path => {
    await locks.request(path, async () => {
      if (path === configPath) {
        server.logger.info('Config file changed, applying changes...');
        await safeApplyConfig(server.logger, options, observableOptions, configPath);
        return;
      }

      server.logger.info('Restarting Prism...');
      disposeHandlers(observableOptions);

      try {
        const operations = getHttpOperationsFromSpec(await readDocument(observableOptions.document));
        if (operations.length === 0) {
          server.logger.info('No operations found in the current file, continuing with the previously loaded spec.');
        } else {
          await server.close();
          server.logger.info('Loading the updated operations...');
          const newServer = await createPrism(observableOptions);
          if (newServer) {
            server = newServer;
          }
        }
      } catch (ex) {
        server.logger.warn('Something went terribly wrong, trying to start Prism with the original document.');
        try {
          await server.close();
          await createPrism(observableOptions);
        } catch {
          process.exit(1);
        }
      }
    });
  }).catch(error => {
    server.logger.error(`Error watching the file system: ${String(error)}`);
    process.exit(1);
  });

  return server;
}
