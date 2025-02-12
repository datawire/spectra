import { getHttpConfigFromRequest } from '../getHttpConfigFromRequest';
import { assertLeft, assertRight } from '@stoplight/prism-core/src/__tests__/utils';

describe('getHttpConfigFromRequest()', () => {
  describe('given no default config', () => {
    describe('query', () => {
      test('and no query should return my own default', () => {
        return assertRight(
          getHttpConfigFromRequest({
            url: { path: '/' },
          }),
          parsed => expect(parsed).toEqual({})
        );
      });

      test('and no matching query should return my own default', () => {
        return assertRight(getHttpConfigFromRequest({ url: { path: '/', query: {} } }), parsed =>
          expect(parsed).toEqual({})
        );
      });

      test('extracts code', () => {
        return assertRight(getHttpConfigFromRequest({ url: { path: '/', query: { __code: '202' } } }), parsed =>
          expect(parsed).toHaveProperty('code', 202)
        );
      });

      test('validates code is a number', () => {
        return assertLeft(
          getHttpConfigFromRequest({
            url: { path: '/', query: { __code: 'default' } },
          }),
          error =>
            expect(error.name).toEqual(
              'https://www.getambassador.io/docs/blackbird/latest/reference/mock-server-errors#unprocessable_entity'
            )
        );
      });

      test('extracts example', () => {
        return assertRight(getHttpConfigFromRequest({ url: { path: '/', query: { __example: 'bear' } } }), parsed =>
          expect(parsed).toHaveProperty('exampleKey', 'bear')
        );
      });

      test('extracts dynamic', () => {
        return assertRight(getHttpConfigFromRequest({ url: { path: '/', query: { __dynamic: 'true' } } }), parsed =>
          expect(parsed).toHaveProperty('dynamic', true)
        );
      });
    });

    describe('headers', () => {
      test('extracts code', () => {
        return assertRight(getHttpConfigFromRequest({ url: { path: '/' }, headers: { prefer: 'code=202' } }), parsed =>
          expect(parsed).toHaveProperty('code', 202)
        );
      });

      test('validates code is a valid http status', () => {
        assertLeft(
          getHttpConfigFromRequest({
            url: { path: '/' },
            headers: { prefer: 'code=default' },
          }),
          error =>
            expect(error.name).toEqual(
              'https://www.getambassador.io/docs/blackbird/latest/reference/mock-server-errors#unprocessable_entity'
            )
        );

        assertLeft(
          getHttpConfigFromRequest({
            url: { path: '/' },
            headers: { prefer: 'code=500000' },
          }),
          error =>
            expect(error.name).toEqual(
              'https://www.getambassador.io/docs/blackbird/latest/reference/mock-server-errors#unprocessable_entity'
            )
        );
      });

      test('extracts example', () => {
        return assertRight(
          getHttpConfigFromRequest({ url: { path: '/' }, headers: { prefer: 'example=bear' } }),
          parsed => expect(parsed).toHaveProperty('exampleKey', 'bear')
        );
      });

      test('extracts dynamic', () => {
        return assertRight(
          getHttpConfigFromRequest({ url: { path: '/' }, headers: { prefer: 'dynamic=true' } }),
          parsed => expect(parsed).toHaveProperty('dynamic', true)
        );
      });

      test('prefers header over query', () => {
        return assertRight(
          getHttpConfigFromRequest({
            url: { path: '/', query: { __dynamic: 'false' } },
            headers: { prefer: 'dynamic=true' },
          }),
          parsed => expect(parsed).toHaveProperty('dynamic', true)
        );
      });

      test('extracts delay', () => {
        assertRight(getHttpConfigFromRequest({ url: { path: '/' }, headers: { prefer: 'delay=100' } }), parsed =>
          expect(parsed).toHaveProperty('delay', 100)
        );

        assertRight(getHttpConfigFromRequest({ url: { path: '/' }, headers: { prefer: 'delay=0' } }), parsed =>
          expect(parsed).toHaveProperty('delay', 0)
        );
      });

      test('validates delay is a non-negative number', () => {
        assertLeft(getHttpConfigFromRequest({ url: { path: '/' }, headers: { prefer: 'delay=bear' } }), error =>
          expect(error.name).toEqual(
            'https://www.getambassador.io/docs/blackbird/latest/reference/mock-server-errors#unprocessable_entity'
          )
        );

        assertLeft(getHttpConfigFromRequest({ url: { path: '/' }, headers: { prefer: 'delay=-100' } }), error =>
          expect(error.name).toEqual(
            'https://www.getambassador.io/docs/blackbird/latest/reference/mock-server-errors#unprocessable_entity'
          )
        );
      });

      test('validates delay is smaller than or equal to 5000', () => {
        assertLeft(getHttpConfigFromRequest({ url: { path: '/' }, headers: { prefer: 'delay=5001' } }), error =>
          expect(error.name).toEqual(
            'https://www.getambassador.io/docs/blackbird/latest/reference/mock-server-errors#unprocessable_entity'
          )
        );

        assertRight(getHttpConfigFromRequest({ url: { path: '/' }, headers: { prefer: 'delay=5000' } }), parsed =>
          expect(parsed).toHaveProperty('delay', 5000)
        );
      });
    });
  });
});
