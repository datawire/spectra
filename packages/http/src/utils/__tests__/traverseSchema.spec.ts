import { traverseSchema } from '../traverseSchema';

describe('traverseSchema', () => {
  it('calls callback for root schema', () => {
    const schema = { type: 'object' };
    const callback = jest.fn();
    traverseSchema(schema, callback);
    expect(callback).toHaveBeenCalledWith(schema);
  });

  it('calls callback for nested schemas', () => {
    const schema = {
      type: 'object',
      additionalProperties: {
        type: 'object',
        propertyNames: {
          type: 'string',
          pattern: '^[a-z]+$',
        },
      },
    };
    const callback = jest.fn();
    traverseSchema(schema, callback);
    expect(callback).toHaveBeenCalledTimes(3);
    expect(callback).nthCalledWith(2, schema.additionalProperties);
    expect(callback).nthCalledWith(3, schema.additionalProperties.propertyNames);
  });

  it('does not call callback for boolean schemas', () => {
    const schema = {
      type: 'object',
      unevaluatedProperties: false,
      properties: {
        name: false,
        address: true,
      },
    };
    const callback = jest.fn();
    traverseSchema(schema, callback);
    expect(callback).toHaveBeenCalledTimes(1);
  });

  it('calls callback for nested keyed schemas ', () => {
    const schema = {
      type: 'object',
      properties: {
        name: { type: 'string' },
        address: {
          type: 'object',
          properties: { street: { type: 'string' } },
        },
        countries: {
          patternProperties: {
            '^\\d{3}$': { type: 'string' },
          },
        },
      },
    };
    const callback = jest.fn();
    traverseSchema(schema, callback);
    expect(callback).toHaveBeenCalledTimes(6);
    expect(callback).nthCalledWith(2, schema.properties.name);
    expect(callback).nthCalledWith(3, schema.properties.address);
    expect(callback).nthCalledWith(4, schema.properties.address.properties.street);
    expect(callback).nthCalledWith(5, schema.properties.countries);
    expect(callback).nthCalledWith(6, schema.properties.countries['patternProperties']['^\\d{3}$']);
  });

  it.each(['anyOf', 'oneOf', 'allOf'])('calls callback for compound schemas', keyword => {
    const schema = {
      [keyword]: [
        {
          type: 'object',
          properties: {
            name: false,
          },
        },
        {
          type: 'object',
          properties: {
            address: true,
          },
        },
      ],
    };
    const callback = jest.fn();
    traverseSchema(schema, callback);
    expect(callback).toHaveBeenCalledTimes(3);
    expect(callback).nthCalledWith(2, schema[keyword][0]);
    expect(callback).nthCalledWith(3, schema[keyword][1]);
  });
});
