import { isPlainObject } from '@stoplight/json';
import * as $RefParser from '@stoplight/json-schema-ref-parser';

export async function getSpec(
  specFilePathOrObject: string | object,
  options: $RefParser.Options = {}
): Promise<Record<string, unknown>> {
  const result = await new $RefParser().bundle(specFilePathOrObject, options);
  if (!isPlainObject(result)) {
    throw new Error('Unsupported document format');
  }

  return result;
}
