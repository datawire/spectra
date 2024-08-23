import type { IPrismHttpServer } from '@stoplight/prism-http-server/src/types';
import * as chokidar from 'chokidar';
import * as os from 'os';
import * as process from 'process';
import { join, isAbsolute } from 'path';
import { CreateMockServerOptions } from './createServer';
import { getHttpOperationsFromSpec } from '@stoplight/prism-http';
import { safeApplyConfig } from './config';
import { disposeHandlers, type Observable, observable } from './observable';

export type CreatePrism = (options: Observable<CreateMockServerOptions>) => Promise<IPrismHttpServer | void>;

function resolveConfigPath(config: string | undefined): string | undefined {
  return config === void 0 || isAbsolute(config) ? config : join(process.cwd(), config);
}

export async function runPrismAndSetupWatcher(
  createPrism: CreatePrism,
  options: CreateMockServerOptions
): Promise<IPrismHttpServer | void> {
  const observableOptions = observable({ ...options });
  const possibleServer = await createPrism(observableOptions);
  if (!possibleServer) {
    throw new Error('Failed to start Prism. No possible server was returned.');
  }

  const configPath = resolveConfigPath(options.config);
  if (configPath !== void 0) {
    await safeApplyConfig(possibleServer.logger, options, observableOptions, configPath);
  }

  let server: IPrismHttpServer = possibleServer;

  const watcher = chokidar.watch([observableOptions.document, configPath].filter(Boolean) as string[], {
    // See https://github.com/paulmillr/chokidar#persistence
    persistent: os.platform() === 'darwin',
    disableGlobbing: true,
    awaitWriteFinish: { stabilityThreshold: 500, pollInterval: 100 },
  });

  watcher.on('change', path => {
    if (path === configPath) {
      server.logger.info('Config file changed, applying changes...');
      void safeApplyConfig(server.logger, options, observableOptions, configPath);
      return;
    }

    server.logger.info('Restarting Prism...');
    disposeHandlers(observableOptions);

    getHttpOperationsFromSpec(observableOptions.document)
      .then(operations => {
        if (operations.length === 0) {
          server.logger.info('No operations found in the current file, continuing with the previously loaded spec.');
        } else {
          return server
            .close()
            .then(() => {
              server.logger.info('Loading the updated operations...');

              return createPrism(observableOptions);
            })
            .then(newServer => {
              if (newServer) {
                server = newServer;
              }
            });
        }
      })
      .catch(() => {
        server.logger.warn('Something went terribly wrong, trying to start Prism with the original document.');

        return server
          .close()
          .then(() => createPrism(observableOptions))
          .catch(() => process.exit(1));
      });
  });

  return new Promise(resolve => watcher.once('ready', () => resolve(server)));
}
