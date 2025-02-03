import { get, camelCase, forOwn } from 'lodash';
import { JSONSchemaFaker } from 'json-schema-faker';
import type { JSONSchemaFakerOptions } from 'json-schema-faker';
import { resetJSONSchemaGenerator } from '@stoplight/prism-http';
import { type Observable, observeAll } from './util/observable';

export function configureExtensionsUserProvided(
  result: Record<string, unknown>,
  cliParamOptions: Observable<JSONSchemaFakerOptions>
): void {
  resetJSONSchemaGenerator();

  observeAll(cliParamOptions, key => {
    setFakerValue(key, cliParamOptions[key]);
  });

  forOwn(get(result, 'x-json-schema-faker', {}), (value: any, option: string) => {
    setFakerValue(camelCase(option) as keyof JSONSchemaFakerOptions | 'locale', value);
  });

  // cli parameter takes precedence, so it is set after spec extensions are confined
  for (const param of Object.keys(cliParamOptions) as (keyof JSONSchemaFakerOptions)[]) {
    setFakerValue(param, cliParamOptions[param]);
  }
}

function setFakerValue<K extends 'locale' | keyof JSONSchemaFakerOptions>(
  option: K,
  value: K extends keyof JSONSchemaFakerOptions ? JSONSchemaFakerOptions[K] : string
) {
  if (option === 'locale') {
    JSONSchemaFaker.locate('faker').setLocale(value);
  } else {
    JSONSchemaFaker.option(option, value);
  }
}
