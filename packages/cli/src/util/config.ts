import { promises as fs } from 'fs';
import * as Ajv from 'ajv';
import type * as pino from 'pino';
import type { CreateMockServerOptions } from './createServer';
import type { Observable } from './observable';

const ajv = new Ajv.Ajv({
  strict: true,
  allErrors: true,
});

const validate = ajv.compile({
  type: 'object',
  properties: {
    ignoreExamples: { type: 'boolean' },
    dynamic: { type: 'boolean' },
    jsonSchemaFakerFillProperties: { type: 'boolean' },
  } satisfies Partial<Record<keyof CreateMockServerOptions, unknown>>,
  additionalProperties: false,
});

export async function safeApplyConfig(
  logInstance: pino.Logger,
  defaultConfig: CreateMockServerOptions,
  config: Observable<CreateMockServerOptions>,
  filepath: string
): Promise<void> {
  let content: string;
  try {
    content = await fs.readFile(filepath, 'utf8');
  } catch (e) {
    if (e instanceof Error && (e as NodeJS.ErrnoException).code === 'ENOENT') {
      return;
    }

    logInstance.error(`Error reading config file: ${String(e)}`);
    return;
  }

  try {
    const input = JSON.parse(content);
    const valid = validate(input) as unknown as (input: unknown) => input is CreateMockServerOptions;
    if (!valid) {
      throw ajv.errorsText(validate.errors);
    }

    const merged = { ...defaultConfig, ...input };
    for (const key of Object.keys(merged)) {
      if (config[key] !== merged[key]) {
        config[key] = merged[key];
      }
    }

    logInstance.info('Config file applied successfully');
  } catch (e) {
    logInstance.error(`Invalid config file: ${String(e)}`);
  }
}
