import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { notebook } from '../converter/fixtures.js';

const bin = path.resolve(import.meta.dirname, '../../bin/xpyb.js');
const dirs = [];
const run = (args, cwd) => spawnSync(process.execPath, [bin, ...args], { cwd, encoding: 'utf8' });

afterEach(() => {
  dirs.splice(0).forEach((dir) => fs.rmSync(dir, { recursive: true, force: true }));
});

describe('xpyb binary', () => {
  it('converts a relative notebook path and exits cleanly', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'xpyb-bin-'));
    dirs.push(dir);
    fs.writeFileSync(path.join(dir, 'talk.ipynb'), JSON.stringify(notebook()));
    const result = run(['convert', 'talk.ipynb'], dir);
    expect(result.status).toBe(0);
    expect(result.stdout).toContain('Created');
    expect(fs.existsSync(path.join(dir, 'talk.xpyb'))).toBe(true);
  });

  it('exits with usage for invalid arguments', () => {
    const result = run(['convert'], process.cwd());
    expect(result.status).toBe(2);
    expect(result.stderr).toContain('Usage:');
  });
});
