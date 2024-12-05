import { Dictionary } from '@stoplight/types/dist';
import * as xmlDiff from 'diff-js-xml';
const { XMLValidator} = require("fast-xml-parser");
import { is as typeIs } from 'type-is';

type Result = { body: string; headers: Dictionary<string> };

export const xmlValidator = {
  test: (contentType: string, content: string) => {
    const doesContentTypeMatch = !!typeIs(contentType, [
      'application/xml',
      'application/*+xml',
      'text/xml',
    ]);
    const isContentXML = XMLValidator.validate(content) === true;

    return doesContentTypeMatch || isContentXML;
  },
  validate: (expected: Result, output: Result) => {
    return new Promise(res =>
      xmlDiff.diffAsXml(expected.body, output.body, {}, { compareElementValues: false }, result =>
        res(result)
      )
    );
  },
};

export function parseSpecFile(spec: string) {
  const regex = /====(server|test|spec|config|command|script|expect|expect-stdout|expect-loose|expect-keysOnly)====\r?\n/gi;
  const splitted = spec.split(regex);

  const testIndex = splitted.findIndex(t => t === 'test');
  const specIndex = splitted.findIndex(t => t === 'spec');
  const configIndex = splitted.findIndex(t => t === 'config');
  const serverIndex = splitted.findIndex(t => t === 'server');
  const commandIndex = splitted.findIndex(t => t === 'command');
  const scriptIndex = splitted.findIndex(t => t === 'script');
  const expectIndex = splitted.findIndex(t => t === 'expect');
  const expectLooseIndex = splitted.findIndex(t => t === 'expect-loose');
  const expectStdoutIndex = splitted.findIndex(t => t === 'expect-stdout');
  const expectKeysOnlyIndex = splitted.findIndex(t => t === 'expect-keysOnly');

  if (expectStdoutIndex !== -1 && (expectIndex !== -1 || expectLooseIndex !== -1 || expectKeysOnlyIndex !== -1)) {
    throw new Error('Cannot have expect-stdout with expect, expect-loose, or expect-keysOnly');
  }

  return {
    test: splitted[1 + testIndex],
    spec: splitted[1 + specIndex],
    config: configIndex === -1 ? null : splitted[1 + configIndex],
    server: splitted[1 + serverIndex],
    command: commandIndex === -1 ? null : splitted[1 + commandIndex],
    script: scriptIndex === -1 ? null : splitted[1 + scriptIndex],
    expect: expectIndex === -1 ? null : splitted[1 + expectIndex],
    expectStdout: expectStdoutIndex === -1 ? null : splitted[1 + expectStdoutIndex],
    expectLoose: expectLooseIndex === -1 ? null : splitted[1 + expectLooseIndex],
    expectKeysOnly: expectKeysOnlyIndex === -1 ? null : splitted[1 + expectKeysOnlyIndex],
  };
}
