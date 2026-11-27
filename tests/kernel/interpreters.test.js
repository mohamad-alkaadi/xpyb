import fs from 'node:fs/promises';
import { createRequire } from 'node:module';
import os from 'node:os';
import path from 'node:path';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';

const require = createRequire(import.meta.url);
const lib = '../../electron/lib/kernel';
const { detectInterpreters, validatePythonPath, venvCandidates } = require(`${lib}/interpreters`);
const { pickInterpreter } = require(`${lib}/pickInterpreter`);

let root;
const file = async (relative, mode) => {
  const target = path.join(root, relative);
  await fs.mkdir(path.dirname(target), { recursive: true });
  await fs.writeFile(target, '', { mode });
  return target;
};

beforeAll(async () => {
  root = await fs.mkdtemp(path.join(os.tmpdir(), 'xpyb-interp-'));
});
afterAll(() => fs.rm(root, { recursive: true, force: true }));

describe('interpreters', () => {
  it('uses the platform layout', () => {
    expect(venvCandidates('/d', 'linux')[0].path).toBe(path.join('/d', '.venv', 'bin', 'python'));
    expect(venvCandidates('/d', 'win32')[1].path).toBe(
      path.join('/d', 'venv', 'Scripts', 'python.exe'),
    );
  });

  it.skipIf(process.platform === 'win32')('detects executables next to the deck', async () => {
    const dotVenv = await file('.venv/bin/python', 0o755);
    await file('venv/bin/python', 0o644);
    expect(await detectInterpreters(path.join(root, 'deck.xpyb'))).toEqual([
      { label: '.venv', path: dotVenv },
    ]);
    expect(await detectInterpreters(null)).toEqual([]);
    expect(await detectInterpreters('deck.xpyb')).toEqual([]);
  });

  it.skipIf(process.platform === 'win32')('accepts only Python executables', async () => {
    const python = await file('bin/python3.14', 0o755);
    const shell = await file('bin/bash', 0o755);
    expect(await validatePythonPath(python)).toBe(python);
    expect(await validatePythonPath(null)).toBeNull();
    const rejected = [shell, 'python', path.join(root, 'none', 'python'), 5, undefined];
    for (const candidate of rejected) {
      await expect(validatePythonPath(candidate)).rejects.toThrow('Python executable');
    }
  });

  it('returns the dialog choice', async () => {
    const showOpenDialog = vi.fn(async () => ({ canceled: false, filePaths: ['/v/python'] }));
    expect(await pickInterpreter({ showOpenDialog }, {})).toBe('/v/python');
    expect(showOpenDialog.mock.calls[0][1].properties).toContain('showHiddenFiles');
    showOpenDialog.mockResolvedValueOnce({ canceled: true, filePaths: [] });
    expect(await pickInterpreter({ showOpenDialog }, {})).toBeNull();
  });
});
