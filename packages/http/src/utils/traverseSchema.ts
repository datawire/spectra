import { isPlainObject } from '@stoplight/json';

const keywords = new Set([
  'additionalItems',
  'unevaluatedItems',
  'items',
  'contains',

  'additionalProperties',
  'unevaluatedProperties',
  'propertyNames',

  'not',
  'if',
  'then',
  'else',
] as const);

const arrayishKeywords = new Set(['items', 'prefixItems', 'allOf', 'anyOf', 'oneOf'] as const);

const propsKeywords = new Set(['properties', 'patternProperties', 'dependencies', 'dependentSchemas'] as const);

function hasKeyword(set: Set<string>, keyword: string) {
  return set.has(keyword);
}

export function traverseSchema(schema: Record<string, unknown>, callback: (schema: Record<string, unknown>) => void) {
  callback(schema);

  for (const [keyword, value] of Object.entries(schema)) {
    if (hasKeyword(keywords, keyword) && isPlainObject(value)) {
      traverseSchema(value, callback);
    } else if (hasKeyword(arrayishKeywords, keyword) && Array.isArray(value)) {
      for (const item of value) {
        traverseSchema(item, callback);
      }
    } else if (hasKeyword(propsKeywords, keyword) && isPlainObject(value)) {
      for (const prop of Object.values(value)) {
        if (isPlainObject(prop)) {
          traverseSchema(prop, callback);
        }
      }
    }
  }
}
