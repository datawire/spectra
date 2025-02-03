import { getSpec } from '../getSpec';

describe('getSpec()', () => {
  describe('ref resolving fails', () => {
    it('fails with exception', () => {
      return expect(
        getSpec({
          openapi: '3.0.0',
          paths: { $ref: 'abc://' },
        })
      ).rejects.toThrow('Unable to resolve $ref pointer "abc://"');
    });

    it('deduplicates similar errors', () => {
      return expect(
        getSpec({
          openapi: '3.0.0',
          paths: { $ref: 'abc://' },
          definitions: { $ref: 'abc://' },
        })
      ).rejects.toThrow('Unable to resolve $ref pointer "abc://"');
    });
  });
});
