import { XMLBuilder } from 'fast-xml-parser';
import { is as typeIs } from 'type-is';

const xmlSerializer = new XMLBuilder({});

const serializers = [
  {
    test: (value: string) => !!typeIs(value, ['application/json', 'application/*+json']),
    serializer: JSON.stringify,
  },
  {
    test: (value: string) => !!typeIs(value, ['application/xml', 'application/*+xml']),
    serializer: (data: unknown) => (typeof data === 'string' ? data : xmlSerializer.build({ xml: data })),
  },
  {
    test: (value: string) => !!typeIs(value, ['text/*']),
    serializer: (data: unknown) => {
      if (['string', 'undefined'].includes(typeof data)) {
        return data;
      }

      throw Object.assign(new Error('Cannot serialise complex objects as text.'), {
        detail:
          'Cannot serialise complex objects as text. Visit the Blackbird documentation for more details here: https://www.getambassador.io/docs/blackbird/latest/reference/mock-server-errors#no_complex_object_text',
        status: 500,
        name: 'https://www.getambassador.io/docs/blackbird/latest/reference/mock-server-errors#no_complex_object_text',
      });
    },
  },
];

export const serialize = (payload: unknown, contentType?: string) => {
  if (!contentType && !payload) {
    return;
  }

  const serializer = contentType ? serializers.find(s => s.test(contentType)) : undefined;

  if (!serializer) {
    if (typeof payload === 'string') return payload;

    throw new Error(`Cannot find serializer for ${contentType}`);
  }

  return serializer.serializer(payload);
};
