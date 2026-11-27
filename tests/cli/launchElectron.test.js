import { EventEmitter } from 'node:events';
import { createRequire } from 'node:module';
import { describe, expect, it, vi } from 'vitest';

const require = createRequire(import.meta.url);
const { desktopEnv, launchElectron } = require('../../electron/lib/cli/launchElectron');

describe('launchElectron', () => {
  it('removes only the run-as-node flag from the environment', () => {
    const env = { PATH: '/venv/bin', VIRTUAL_ENV: '/venv', ELECTRON_RUN_AS_NODE: '1' };
    expect(desktopEnv(env)).toEqual({ PATH: '/venv/bin', VIRTUAL_ENV: '/venv' });
    expect(env.ELECTRON_RUN_AS_NODE).toBe('1');
  });

  it('spawns Electron and resolves with its exit code', async () => {
    const child = new EventEmitter();
    const spawn = vi.fn(() => child);
    const result = launchElectron('/app', ['/a.xpyb'], { spawn, electronPath: '/electron' });
    child.emit('close', 3);
    expect(await result).toBe(3);
    expect(spawn.mock.calls[0].slice(0, 2)).toEqual(['/electron', ['/app', '/a.xpyb']]);
  });

  it('rejects when Electron cannot start', async () => {
    const child = new EventEmitter();
    const result = launchElectron('/app', [], { spawn: () => child, electronPath: '/electron' });
    child.emit('error', new Error('ENOENT'));
    await expect(result).rejects.toThrow('ENOENT');
  });

  it('forwards stop signals until Electron exits', async () => {
    const child = Object.assign(new EventEmitter(), { kill: vi.fn() });
    const signalSource = new EventEmitter();
    const options = { spawn: () => child, electronPath: '/electron', signalSource };
    const result = launchElectron('/app', [], options);
    signalSource.emit('SIGTERM');
    expect(child.kill).toHaveBeenCalledWith('SIGTERM');
    child.emit('close', 0);
    await result;
    expect(signalSource.eventNames()).toEqual([]);
  });
});
