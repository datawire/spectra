import { assertValidConfig, type Config } from '../config';

describe('assertValidConfig', () => {
  it('should not throw an error for a valid config', () => {
    const validConfig: Config = {
      ignoreExamples: true,
      dynamic: false,
      jsonSchemaFakerFillProperties: true,
      delay: [100, 200],
      chaos: {
        enabled: true,
        rate: 50,
        codes: [500, 502],
      },
    };

    expect(assertValidConfig.bind(null, validConfig)).not.toThrow();
  });

  it('should accept numeric delay', () => {
    const validConfig: Config = {
      delay: 100,
    };

    expect(assertValidConfig.bind(null, validConfig)).not.toThrow();
  });

  it('should throw an error for an invalid config', () => {
    const invalidConfig = {
      ignoreExamples: 'true', // invalid type
      dynamic: false,
      jsonSchemaFakerFillProperties: true,
      chaos: {
        enabled: true,
        rate: 50,
        codes: [500, 502],
      },
    };

    expect(assertValidConfig.bind(null, invalidConfig)).toThrow();
  });

  it('should throw an error for a config with missing required properties', () => {
    const invalidConfig = {
      dynamic: false,
      jsonSchemaFakerFillProperties: true,
      chaos: {
        enabled: true,
        rate: 50,
      },
    };

    expect(assertValidConfig.bind(null, invalidConfig)).toThrow();
  });

  it('should throw an error for a config with additional properties', () => {
    const invalidConfig = {
      ignoreExamples: true,
      dynamic: false,
      jsonSchemaFakerFillProperties: true,
      extraProperty: 'not allowed',
    };

    expect(assertValidConfig.bind(null, invalidConfig)).toThrow();
  });

  it('should throw an error for a config with enabled chaos and no/empty codes', () => {
    expect(
      assertValidConfig.bind(null, {
        chaos: {
          enabled: true,
          rate: 50,
        },
      })
    ).toThrow();

    expect(
      assertValidConfig.bind(null, {
        chaos: {
          enabled: true,
          rate: 50,
          codes: [],
        },
      })
    ).toThrow();
  });

  it('should require upper latency bound to be higher than lower latency bound', () => {
    expect(
      assertValidConfig.bind(null, {
        delay: [100, 50],
      })
    ).toThrow();
  });

  it('should throw an error for a config with negative delay', () => {
    expect(
      assertValidConfig.bind(null, {
        delay: -100,
      })
    ).toThrow();
  });
});
