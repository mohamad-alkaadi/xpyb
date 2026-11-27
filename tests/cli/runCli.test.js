import { createRequire } from 'node:module';
import { describe, expect, it, vi } from 'vitest';

const require = createRequire(import.meta.url);
const { runCli } = require('../../electron/lib/cli/runCli');

const createDeps = () => ({
  cwd: import.meta.dirname,
  log: vi.fn(),
  logError: vi.fn(),
  convert: vi.fn(async () => ({ deckPath: '/work/talk.xpyb' })),
  launch: vi.fn(async () => 0),
});

describe('runCli', () => {
  it('converts without launching the desktop app', async () => {
    const deps = createDeps();
    expect(await runCli(['convert', '/work/talk.ipynb'], deps)).toBe(0);
    expect(deps.convert).toHaveBeenCalledWith('/work/talk.ipynb');
    expect(deps.log).toHaveBeenCalledWith('Created /work/talk.xpyb');
    expect(deps.launch).not.toHaveBeenCalled();
  });

  it('returns 2 with usage for bad arguments', async () => {
    const deps = createDeps();
    expect(await runCli(['nope.txt'], deps)).toBe(2);
    expect(deps.logError.mock.calls[0][0]).toContain('Usage:');
  });

  it('returns 1 when conversion fails', async () => {
    const deps = createDeps();
    deps.convert.mockRejectedValue(new Error('boom'));
    expect(await runCli(['convert', 'x.ipynb'], deps)).toBe(1);
    expect(deps.logError).toHaveBeenCalledWith('xpyb: boom');
  });

  it.each(['--help', '-h'])('prints the usage guide for %s and does nothing else', async (flag) => {
    const deps = createDeps();
    expect(await runCli([flag], deps)).toBe(0);
    expect(deps.log).toHaveBeenCalledTimes(1);
    expect(deps.logError).not.toHaveBeenCalled();
    expect(deps.launch).not.toHaveBeenCalled();
    expect(deps.convert).not.toHaveBeenCalled();
  });

  it('launches an empty window', async () => {
    const deps = createDeps();
    await runCli([], deps);
    expect(deps.launch).toHaveBeenCalledWith([]);
  });

  it('rejects a missing deck before launching', async () => {
    const deps = createDeps();
    expect(await runCli(['missing.xpyb'], deps)).toBe(1);
    expect(deps.launch).not.toHaveBeenCalled();
  });

  it('forwards existing decks to the desktop app', async () => {
    const deps = createDeps();
    const fs = require('node:fs');
    vi.spyOn(fs, 'existsSync').mockReturnValue(true);
    await runCli(['/work/talk.xpyb'], deps);
    await runCli(['present', '/work/talk.xpyb'], deps);
    expect(deps.launch.mock.calls).toEqual([
      [['/work/talk.xpyb']],
      [['present', '/work/talk.xpyb']],
    ]);
  });
});
