import { getHttpOperationsFromSpec } from '../operations';

describe('getHttpOperationsFromSpec()', () => {
  describe('OpenAPI 2 document is provided', () => {
    it('detects it properly', () => {
      expect(getHttpOperationsFromSpec({ swagger: '2.0' })).toBeTruthy();
    });
  });

  describe('OpenAPI 3 document is provided', () => {
    it('detects it properly', () => {
      expect(getHttpOperationsFromSpec({ openapi: '3.0.0' })).toBeTruthy();
    });

    it('returns correct HttpOperation', () => {
      expect(
        getHttpOperationsFromSpec({
          openapi: '3.0.0',
          paths: {
            '/pet': { get: { responses: { 200: { description: 'test' } } } },
          },
        })
      ).toEqual([
        expect.objectContaining({
          method: 'get',
          path: '/pet',
          responses: [
            {
              id: expect.any(String),
              code: '200',
              contents: [],
              description: 'test',
              headers: [],
            },
          ],
        }),
      ]);
    });
  });

  describe('Postman Collection document is provided', () => {
    it('detects it properly', () => {
      expect(getHttpOperationsFromSpec({ info: { name: 'Test' }, item: [] })).toBeTruthy();
    });
  });

  describe('unknown document is provided', () => {
    it('throws error', () => {
      expect(getHttpOperationsFromSpec.bind(null, {})).toThrow(/^Unsupported document format$/);
    });
  });
});
