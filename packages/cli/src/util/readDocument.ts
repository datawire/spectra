import * as os from 'node:os';
import * as $RefParser from '@stoplight/json-schema-ref-parser';
import { getSpec } from '@stoplight/prism-http';

export function readDocument(filepath: string): Promise<Record<string, unknown>> {
  const { version: prismVersion } = require('../../package.json');
  const httpResolverOpts: $RefParser.HTTPResolverOptions = {
    headers: {
      'User-Agent': `PrismMockServer/${prismVersion} (${os.type()} ${os.arch()} ${os.release()})`,
    },
  };
  return getSpec(filepath, { resolve: { http: httpResolverOpts } });
}
