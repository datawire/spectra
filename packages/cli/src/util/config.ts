import { promises as fs } from 'fs';
import * as Ajv from 'ajv/dist/2020';
import type * as pino from 'pino';
import type { CreateMockServerOptions } from './createServer';
import type { Observable } from './observable';

export type Config = {
  ignoreExamples?: boolean;
  dynamic?: boolean;
  jsonSchemaFakerFillProperties?: boolean;
  delay?: number | [lowerBound: number, upperBound: number];
  chaos?: {
    enabled?: boolean;
    rate?: number;
    codes?: number[];
  } & (
    | {
        enabled: true;
        codes: [number, ...number[]];
      }
    | {
        enabled?: false;
      }
  );
};

const ajv = new Ajv.Ajv2020({
  strict: true,
  allErrors: true,
  $data: true,
});

const validate = ajv.compile({
  type: 'object',
  properties: {
    ignoreExamples: { type: 'boolean' },
    dynamic: { type: 'boolean' },
    jsonSchemaFakerFillProperties: { type: 'boolean' },
    delay: {
      oneOf: [
        {
          type: 'integer',
          minimum: 0,
          maximum: 5000,
        },
        {
          type: 'array',
          prefixItems: [
            {
              type: 'integer',
              minimum: 0,
              exclusiveMaximum: 5000,
            },
            {
              type: 'integer',
              minimum: {
                $data: '1/0',
              },
              maximum: 5000,
            },
          ],
          minItems: 2,
          items: false,
        },
      ],
    },
    chaos: {
      type: 'object',
      unevaluatedProperties: false,
      properties: {
        enabled: { type: 'boolean' },
        rate: {
          type: 'number',
          minimum: 0,
          maximum: 100,
        },
        codes: {
          type: 'array',
          items: {
            type: 'integer',
            minimum: 400,
            exclusiveMaximum: 600,
          },
          uniqueItems: true,
        },
      },
      oneOf: [
        {
          properties: {
            enabled: { const: true },
            codes: {
              type: 'array',
              minItems: 1,
            },
          },
          required: ['enabled', 'codes'],
        },
        {
          properties: {
            enabled: { const: false },
          },
        },
      ],
    },
  } satisfies Partial<Record<keyof Config, unknown>>,
  additionalProperties: false,
});

export function assertValidConfig(input: unknown): asserts input is Config {
  if (!validate(input)) {
    throw new Error(ajv.errorsText(validate.errors));
  }
}

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
    assertValidConfig(input);

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
