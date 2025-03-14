import faker from '@faker-js/faker';
import { JSONSchema } from '../../types';

import { JSONSchemaFaker } from 'json-schema-faker';
import * as sampler from '@stoplight/json-schema-sampler';
import { Either, toError, tryCatch } from 'fp-ts/Either';
import { IHttpContent, IHttpOperation, IHttpParam } from '@stoplight/types';
import { pipe } from 'fp-ts/function';
import * as E from 'fp-ts/lib/Either';
import * as A from 'fp-ts/Array';
import * as R from 'fp-ts/Record';
import { stripWriteOnlyProperties } from '../../utils/filterRequiredProperties';

// necessary as workaround broken types in json-schema-faker
// @ts-ignore
JSONSchemaFaker.extend('faker', () => faker);

const MAX_TICKS = 2500;

// From https://github.com/json-schema-faker/json-schema-faker/tree/develop/docs
// Using from entries since the types aren't 100% compatible
const JSON_SCHEMA_FAKER_DEFAULT_OPTIONS = Object.fromEntries([
  ['defaultInvalidTypeProduct', null],
  ['defaultRandExpMax', 10],
  ['pruneProperties', []],
  ['ignoreProperties', []],
  ['ignoreMissingRefs', false],
  ['failOnInvalidTypes', true],
  ['failOnInvalidFormat', true],
  ['alwaysFakeOptionals', false],
  ['optionalsProbability', false],
  ['fixedProbabilities', false],
  ['useExamplesValue', false],
  ['useDefaultValue', false],
  ['requiredOnly', false],
  ['minItems', 0],
  ['maxItems', null],
  ['minLength', 0],
  ['maxLength', null],
  ['refDepthMin', 0],
  ['refDepthMax', 3],
  ['resolveJsonPath', false],
  ['reuseProperties', false],
  ['sortProperties', null],
  ['fillProperties', true],
  ['random', Math.random],
  ['replaceEmptyByRandomValue', false],
  ['omitNulls', false],
  ['ticks', MAX_TICKS],
]);

export function resetGenerator() {
  // necessary as workaround broken types in json-schema-faker
  // @ts-ignore
  JSONSchemaFaker.option({
    ...JSON_SCHEMA_FAKER_DEFAULT_OPTIONS,
    failOnInvalidTypes: false,
    failOnInvalidFormat: false,
    alwaysFakeOptionals: true,
    optionalsProbability: 1,
    fixedProbabilities: true,
    ignoreMissingRefs: true,
  });
}

resetGenerator();

export function generate(
  resource: IHttpOperation | IHttpParam | IHttpContent,
  bundle: unknown,
  source: JSONSchema
): Either<Error, unknown> {
  return pipe(
    stripWriteOnlyProperties(source),
    E.fromOption(() => Error('Cannot strip writeOnly properties')),
    E.chain(updatedSource =>
      tryCatch(
        () =>
          pipe(
            {
              ...JSON.parse(JSON.stringify(updatedSource)),
              __bundled__: bundle,
            },
            targetSchema =>
              pipe(
                Object.getOwnPropertyDescriptors(source),
                R.toEntries,
                A.filter(([, descriptor]) => !descriptor!.enumerable),
                R.fromEntries,
                descriptors => Object.defineProperties(targetSchema, descriptors as Record<string, PropertyDescriptor>)
              ),
            JSONSchemaFaker.generate,
            sortSchemaAlphabetically
          ),
        toError
      )
    ),
    E.mapLeft(err => {
      if (err instanceof RangeError) {
        return new SchemaTooComplexGeneratorError(resource, err);
      }
      return err;
    })
  );
}

//sort alphabetically by keys
export function sortSchemaAlphabetically(source: any): any {
  if (source && Array.isArray(source)) {
    for (const i of source) {
      if (typeof source[i] === 'object') {
        source[i] = sortSchemaAlphabetically(source[i]);
      }
    }
    return source;
  } else if (source && typeof source === 'object') {
    Object.keys(source).forEach((key: string) => {
      if (typeof source[key] === 'object') {
        source[key] = sortSchemaAlphabetically(source[key]);
      }
    });
    return Object.fromEntries(Object.entries(source).sort());
  }

  //just return if not array or object
  return source;
}

export function generateStatic(operation: IHttpOperation, source: JSONSchema): Either<Error, unknown> {
  return pipe(
    tryCatch(() => sampler.sample(source, { ticks: MAX_TICKS }, operation), toError),
    E.mapLeft(err => {
      if (err instanceof sampler.SchemaSizeExceededError) {
        return new SchemaTooComplexGeneratorError(operation, err);
      }
      return err;
    })
  );
}

export class GeneratorError extends Error {}

export class SchemaTooComplexGeneratorError extends GeneratorError {
  constructor(resource: IHttpOperation | IHttpParam | IHttpContent, public readonly cause: Error) {
    super(SchemaTooComplexGeneratorError.getMessage(resource));
  }

  private static getMessage(resource: IHttpOperation | IHttpParam | IHttpContent) {
    if ('method' in resource) {
      return `The operation ${resource.method.toUpperCase()} ${
        resource.path
      } references a JSON Schema that is too complex to generate.`;
    }

    if ('name' in resource) {
      return `The parameter ${resource.name} references a JSON Schema that is too complex to generate.`;
    }

    return `The content references a JSON Schema that is too complex to generate.`;
  }
}
