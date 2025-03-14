import { transformOas3Operations } from '@stoplight/http-spec/oas3/operation';
import { transformOas2Operations } from '@stoplight/http-spec/oas2/operation';
import { transformPostmanCollectionOperations } from '@stoplight/http-spec/postman/operation';
import { IHttpOperation } from '@stoplight/types';
import { get } from 'lodash';
import type { Spec } from 'swagger-schema-official';
import type { OpenAPIObject } from 'openapi3-ts';
import type { CollectionDefinition } from 'postman-collection';
import { bundleHttpOperation } from './bundleHttpOperation';

export function getHttpOperationsFromSpec(result: Record<string, unknown>): IHttpOperation[] {
  let operations: IHttpOperation[];
  if (isOpenAPI2(result)) operations = transformOas2Operations(result);
  else if (isOpenAPI3(result)) operations = transformOas3Operations(result);
  else if (isPostmanCollection(result)) operations = transformPostmanCollectionOperations(result);
  else throw new Error('Unsupported document format');

  for (const operation of operations) {
    bundleHttpOperation(result, operation);
  }

  return operations;
}

function isOpenAPI2(document: unknown): document is Spec {
  return get(document, 'swagger') !== undefined;
}

function isOpenAPI3(document: unknown): document is OpenAPIObject {
  return get(document, 'openapi') !== undefined;
}

function isPostmanCollection(document: unknown): document is CollectionDefinition {
  return Array.isArray(get(document, 'item')) && get(document, 'info.name') !== undefined;
}
