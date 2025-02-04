import { join } from 'node:path';
import * as $RefParser from '@stoplight/json-schema-ref-parser';
import { transformOas3Operation } from '@stoplight/http-spec/oas3';
import { getSpec } from '../getSpec';
import { bundleHttpOperation } from '../bundleHttpOperation';
import type { IHttpOperation } from '@stoplight/types';

describe('bundleHttpOperation', () => {
  let schemaRefsDocument: Record<string, unknown>;

  beforeAll(async () => {
    schemaRefsDocument = await getSpec(join(__dirname, '__fixtures__/schema-refs.oas3.yaml'));
  });

  it.each(['POST /pets', 'PUT /pets', 'GET /pets/{petId}', 'PUT /pets/{petId}', 'DELETE /pets/{petId}'])(
    'given %s, resects refs in a http operation',
    async op => {
      const [method, path] = op.split(' ');
      const operation = transformOas3Operation({
        document: schemaRefsDocument,
        name: path,
        method: method.toLowerCase(),
        config: {
          type: 'operation',
          documentProp: 'paths',
          nameProp: 'path',
        },
      });

      bundleHttpOperation(JSON.parse(JSON.stringify(schemaRefsDocument)), operation as IHttpOperation<false>);
      await expect($RefParser.dereference(operation)).resolves.toMatchObject({
        path,
        method: method.toLowerCase(),
      });
    }
  );

  it('should contextify schema object', async () => {
    const operation = transformOas3Operation({
      document: schemaRefsDocument,
      name: '/pets/{petId}',
      method: 'get',
      config: {
        type: 'operation',
        documentProp: 'paths',
        nameProp: 'path',
      },
    });

    bundleHttpOperation(JSON.parse(JSON.stringify(schemaRefsDocument)), operation as IHttpOperation<false>);
    await expect(
      $RefParser.dereference(operation.responses[0].contents![0].schema as $RefParser.JSONSchema)
    ).resolves.toEqual({
      $schema: 'http://json-schema.org/draft-07/schema#',
      type: 'object',
      properties: {
        id: {
          type: 'integer',
          format: 'int64',
        },
        category: {
          properties: {
            id: {
              type: 'integer',
              format: 'int64',
            },
            name: {
              type: 'string',
            },
          },
          type: 'object',
          xml: {
            name: 'Category',
          },
        },
        name: {
          type: 'string',
          examples: ['doggie'],
        },
        photoUrls: {
          type: 'array',
          items: {
            type: 'string',
          },
          xml: {
            name: 'photoUrl',
            wrapped: true,
          },
        },
        status: {
          description: 'pet status in the store',
          enum: ['available', 'pending', 'sold'],
          type: 'string',
        },
        tags: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: {
                type: 'integer',
                format: 'int64',
              },
              name: {
                type: 'string',
              },
            },
            xml: {
              name: 'Tag',
            },
          },
          xml: {
            name: 'tag',
            wrapped: true,
          },
        },
      },
      required: ['name', 'photoUrls'],
      'x-stoplight': expect.anything(),
      xml: {
        name: 'Pet',
      },
    });
  });
});
