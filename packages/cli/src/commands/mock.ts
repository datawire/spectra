import { CommandModule } from 'yargs';
import { CreateMockServerOptions, createMultiProcessPrism, createSingleProcessPrism } from '../util/createServer';
import sharedOptions from './sharedOptions';
import { runPrismAndSetupWatcher } from '../util/runner';

const mockCommand: CommandModule = {
  describe: 'Start a mock server with the given document file',
  command: 'mock <document>',
  builder: yargs =>
    yargs
      .positional('document', {
        description: 'Path to a document file. Can be both a file or a fetchable resource on the web.',
        type: 'string',
      })
      .options({
        ...sharedOptions,
        dynamic: {
          alias: 'd',
          description: 'Dynamically generate examples.',
          boolean: true,
          default: false,
        },
        config: {
          description: 'Path to a JSON configuration file.',
          type: 'string',
          default: '.spectra.json',
        },
        'json-schema-faker-fillProperties': {
          description: 'Generate additional properties when using dynamic generation.',
          default: undefined,
          boolean: true,
        },
        ignoreExamples: {
          description: `Tell Prism to treat the spec as though it has no examples. When in static mode,
                        returns an example that has not been generated using json-schema-faker, but was 
                        created by Prism. When in dynamic mode, this flag is ignored, since in dynamic mode,
                        examples are not consulted and json-schema-faker is used to generate a response based 
                        on the schema defined in the spec`,
          boolean: true,
          default: false,
        },
      }),
  handler: async parsedArgs => {
    parsedArgs.jsonSchemaFakerFillProperties = parsedArgs['json-schema-faker-fillProperties'];
    const {
      config,
      multiprocess,
      dynamic,
      port,
      host,
      cors,
      watch,
      watchStrategy,
      document,
      errors,
      verboseLevel,
      ignoreExamples,
      jsonSchemaFakerFillProperties,
    } = parsedArgs as unknown as CreateMockServerOptions;

    const createPrism = multiprocess ? createMultiProcessPrism : createSingleProcessPrism;
    const options = {
      config,
      cors,
      dynamic,
      port,
      host,
      document,
      watch,
      watchStrategy,
      multiprocess,
      errors,
      verboseLevel,
      ignoreExamples,
      jsonSchemaFakerFillProperties,
    } as const;

    const controller = new AbortController();
    try {
      await runPrismAndSetupWatcher(createPrism, options, controller.signal);
    } catch (e) {
      controller.abort();
      throw e;
    }
  },
};

export default mockCommand;
