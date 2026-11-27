import { createRequire } from 'node:module';
import { describe, expect, it } from 'vitest';

const require = createRequire(import.meta.url);
const { parseArgs } = require('../../electron/lib/cli/parseArgs');

describe('parseArgs', () => {
  it('launches an empty window without arguments', () => {
    expect(parseArgs([], '/work')).toEqual({ command: 'launch', filePath: null });
  });

  it.each([
    [['talk.xpyb'], 'open', '/work/talk.xpyb'],
    [['/abs/Talk.XPYB'], 'open', '/abs/Talk.XPYB'],
    [['present', 'talk.xpyb'], 'present', '/work/talk.xpyb'],
    [['convert', 'nb/talk.ipynb'], 'convert', '/work/nb/talk.ipynb'],
  ])('parses %j', (args, command, filePath) => {
    expect(parseArgs(args, '/work')).toEqual({ command, filePath });
  });

  it.each([
    [['convert'], 'exactly one .ipynb'],
    [['present'], 'exactly one .xpyb'],
    [['a.xpyb', 'b.xpyb'], 'exactly one .xpyb'],
    [['talk.ipynb'], 'Expected a .xpyb file'],
    [['convert', 'talk.xpyb'], 'Expected a .ipynb file'],
    [['--verbose'], 'Unknown option'],
  ])('rejects %j', (args, message) => {
    expect(() => parseArgs(args, '/work')).toThrow(message);
  });
});
