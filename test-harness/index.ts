import { ChildProcess, spawn, spawnSync, execSync } from 'child_process';
import * as fs from 'fs';
import { validate } from 'gavel';
import glob = require('glob');
import { parseResponse } from 'http-string-parser';
import { get } from 'lodash';
import * as path from 'path';
import * as split2 from 'split2';
import * as tmp from 'tmp';
import { parseSpecFile, xmlValidator } from './helpers';

jest.setTimeout(15000);

const WAIT_FOR_LINE = 'Prism is listening';
const WAIT_FOR_LINE_TIMEOUT = 10000;

describe('harness', () => {
  const files = process.env.TESTS
    ? String(process.env.TESTS).split(',')
    : glob.sync('**/*.txt', { cwd: path.join(__dirname, './specs') });

  files.forEach(file => {
    const data = fs.readFileSync(path.join(__dirname, './specs/', file), { encoding: 'utf8' });
    const parsed = parseSpecFile(data);

    const tmpFileHandles: tmp.FileSyncObject[] = [];
    const assets: Record<string, string> = {};

    beforeAll(() => {
      for (const key of ['spec', 'config']) {
        if (!parsed[key]) {
          continue;
        }

        const tmpFileHandle = tmp.fileSync({
          postfix: key === 'spec' ? '.yaml' : '.json',
          dir: undefined,
          name: undefined,
          prefix: undefined,
          tries: 10,
          template: undefined,
          unsafeCleanup: undefined,
        });

        tmpFileHandles.push(tmpFileHandle);
        assets[key === 'spec' ? 'document' : key] = tmpFileHandle.name;
        fs.writeFileSync(tmpFileHandle.name, parsed[key], { encoding: 'utf8' });
      }
    });

    afterAll(() => {
      for (const tmpFileHandle of tmpFileHandles) {
        tmpFileHandle.removeCallback(undefined, undefined, undefined, undefined)
      }
    });
    describe(file, () => {
      let prismHandle: ChildProcess;
      beforeEach(async () => {
        prismHandle = await startPrism(parsed.server, assets);
      });

      afterEach(() => {
        return shutdownPrism(prismHandle);
      });

      test(parsed.test, async () => {
        let stdout: string;
        if (parsed.script) {
          stdout = execSync(parsed.script,{
            encoding: 'utf8',
          });
        } else {
          const [command, ...args] = parsed.command.split(/ +/).map(t => t.trim());
          ({ stdout } = spawnSync(command, args, {
            shell: true,
            encoding: 'utf8',
            windowsVerbatimArguments: false,
          }))
        }

        if (parsed.expectStdout !== null) {
          expect(stdout.trim()).toStrictEqual(parsed.expectStdout.trim());
        }

        if (parsed.expect === null && parsed.expectLoose === null && parsed.expectKeysOnly === null) {
          return;
        }

        const output: any = parseResponse(stdout.trim());
        const expected: any = parseResponse((parsed.expect || parsed.expectLoose || parsed.expectKeysOnly).trim());

        const isXml = xmlValidator.test(get(output, ['header', 'content-type'], ''), expected.body);

        if (isXml) {
          const res = await xmlValidator.validate(expected, output);
          expect(res).toStrictEqual([]);
          delete expected.body;
          delete output.body;

          const isValid = validate(expected, output).valid;
          expect(isValid).toBeTruthy();
          return;
        }

        const isValid = validate(expected, output).valid;

        if (!!isValid) {
          expect(isValid).toBeTruthy();
        } else {
          expect(output).toMatchObject(expected);
        }
        if (parsed.expect) {
          expect(output.body).toStrictEqual(expected.body);
        } else if (parsed.expectKeysOnly) {
          const jsonOutput = JSON.parse(output.body);
          const jsonExpected = JSON.parse(expected.body);
          expect(Object.keys(jsonOutput)).toStrictEqual(Object.keys(jsonExpected));
        }
      });
    });
  });
});

function startPrism(server: string, assets: Record<string, string>): Promise<ChildProcess> {
  return new Promise((resolve, reject) => {
    const serverArgs = server.split(/ +/).map(t => t.trim().replace(/\$\{([a-z]+)}/g, (_, key) => assets[key] ?? key))
    const prismMockProcessHandle = spawn(path.join(__dirname, '../cli-binaries/prism-cli'), serverArgs);

    const timeout = setTimeout(() => {
      shutdownPrism(prismMockProcessHandle);
      reject(new Error(`Timeout while waiting for "${WAIT_FOR_LINE}" log line`));
    }, WAIT_FOR_LINE_TIMEOUT);

    if (process.env.DEBUG) {
      prismMockProcessHandle.stderr.pipe(process.stderr);
    }

    prismMockProcessHandle.stdout.pipe(split2()).on('data', (line: string) => {
      if (line.includes(WAIT_FOR_LINE)) {
        clearTimeout(timeout);
        resolve(prismMockProcessHandle);
      }
    });
  });
}

function shutdownPrism(processHandle: ChildProcess): Promise<void> {
  processHandle.kill();
  return new Promise(resolve => {
    processHandle.on('exit', resolve);
  });
}
