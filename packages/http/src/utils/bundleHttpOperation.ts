import type {
  IHttpEncoding,
  IHttpContent,
  IHttpOperation,
  IHttpOperationRequest,
  IHttpOperationResponse,
} from '@stoplight/types';
import { traverseSchema } from './traverseSchema';
import { hasRef, isPlainObject, resolveInlineRef } from '@stoplight/json';

// the date is used to minimize the risk of a collision
// we cannot use a symbol for a property key as this key is included in a JSON pointer
const ROOT_KEY = `__root__-${Date.now()}`;

// this function is used to bundle the HTTP operation
// it mutates the operation object in place, and only touches objects that may have some references
// which in reality is only schema objects as the non-bundled http operation would have all other references resolved as this point
export function bundleHttpOperation(document: Record<string, unknown>, operation: IHttpOperation<false>): void {
  const { responses, request, callbacks } = operation;
  // the key must be non-enumerable
  Object.defineProperty(operation, ROOT_KEY, { value: document });

  if (isDefined(request)) {
    bundleHttpOperationRequest(document, request);
  }

  if (isDefined(responses)) {
    for (const response of responses) {
      bundleHttpOperationResponse(document, response);
    }
  }

  if (isDefined(callbacks)) {
    for (const callback of callbacks) {
      for (const callbackOperation of Object.values(callback)) {
        bundleHttpOperation(document, callbackOperation);
      }
    }
  }
}

function bundleHttpContent(document: Record<string, unknown>, { encodings, schema }: IHttpContent<false>): void {
  if (isDefined(schema)) {
    bundleSchemaObject(document, schema as Record<string, unknown>);
  }

  if (isDefined(encodings)) {
    for (const encoding of encodings) {
      bundleHttpEncoding(document, encoding);
    }
  }
}

function bundleHttpEncoding(document: Record<string, unknown>, { headers }: IHttpEncoding<false>): void {
  if (isDefined(headers)) {
    for (const header of headers) {
      bundleHttpContent(document, header);
    }
  }
}

function bundleHttpOperationRequest(
  document: Record<string, unknown>,
  { body, headers, path, cookie, query }: IHttpOperationRequest<false>
): void {
  if (isDefined(body) && isDefined(body.contents)) {
    for (const content of body.contents) {
      bundleHttpContent(document, content);
    }
  }

  for (const params of [headers, path, cookie, query]) {
    if (!isDefined(params)) continue;
    for (const param of params) {
      bundleHttpContent(document, param);
    }
  }

  return;
}

function bundleHttpOperationResponse(
  document: Record<string, unknown>,
  { contents, headers }: IHttpOperationResponse<false>
): void {
  if (isDefined(contents)) {
    for (const content of contents) {
      bundleHttpContent(document, content);
    }
  }

  if (isDefined(headers)) {
    for (const header of headers) {
      bundleHttpContent(document, header);
    }
  }
}

function bundleSchemaObject(document: Record<string, unknown>, object: Record<string, unknown>): void {
  // if we can't set the descriptor,
  // the value must have been already mutated earlier by us,
  // and we can safely skip it
  if (!Reflect.defineProperty(object, ROOT_KEY, { value: document })) {
    return;
  }

  const traversed = new WeakSet<Record<string, unknown>>();
  const processedRefs = new Set<string>();
  const seen = new Set<Record<string, unknown>>();

  bundleSchema(
    {
      traversed,
      processedRefs,
      seen,
    },
    document,
    object
  );
}

function bundleSchema(
  ctx: {
    readonly traversed: WeakSet<Record<string, unknown>>;
    readonly processedRefs: Set<string>;
    readonly seen: Set<Record<string, unknown>>;
  },
  document: Record<string, unknown>,
  object: Record<string, unknown>
) {
  const { traversed, processedRefs, seen } = ctx;
  traverseSchema(object, schema => {
    traversed.add(schema);
    if (!hasRef(schema)) return;

    const $ref = schema.$ref;
    schema.$ref = rewriteRef($ref);
    if (schema.$ref === $ref) return;
    if (processedRefs.has($ref)) return;

    processedRefs.add($ref);
    const resolved = resolveInlineRef(document, $ref);
    if (isPlainObject(resolved)) {
      seen.add(resolved);
    }
  });

  for (const schema of seen) {
    if (traversed.has(schema)) continue;
    traversed.add(schema);

    traverseSchema(schema, schema => {
      bundleSchema(ctx, document, schema);
    });
  }

  return object;
}

function rewriteRef(value: string) {
  return `#/${ROOT_KEY}${value.slice(1).replace(`/${ROOT_KEY}/`, '/')}`;
}

function isDefined(value: unknown): value is NonNullable<typeof value> {
  return value !== void 0;
}
