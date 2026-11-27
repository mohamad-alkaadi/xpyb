import { createRequire } from 'node:module';
import { describe, expect, it, vi } from 'vitest';
import { createFakeSession, flush } from './fakes.js';

const require = createRequire(import.meta.url);
const { createKernelManager } = require('../../electron/lib/kernel/kernelManager');
const { runAll } = require('../../electron/lib/kernel/runAll');

const setup = () => {
  const sessions = [];
  const createSession = vi.fn(() => sessions[sessions.push(createFakeSession()) - 1]);
  const manager = createKernelManager({ scriptPath: '/r.py', createSession });
  return { manager, sessions, createSession };
};
const ok = { status: 'ok', outputs: [] };

describe('kernel manager', () => {
  it('starts lazily and reuses the session per directory', async () => {
    const { manager, sessions, createSession } = setup();
    expect(manager.isRunning()).toBe(false);
    manager.execute('1', '/a');
    manager.execute('2', '/a');
    expect(createSession).toHaveBeenCalledTimes(1);
    const third = manager.execute('3', '/b');
    expect(sessions[0].stop).toHaveBeenCalled();
    expect(createSession.mock.calls[1][0]).toMatchObject({ cwd: '/b', commands: undefined });
    sessions[1].calls[0].resolve(ok);
    expect(await third).toBe(ok);
  });

  it('uses a custom interpreter after restarting the session', async () => {
    const { manager, sessions, createSession } = setup();
    const pending = manager.execute('1');
    await manager.setPythonPath('/venv/bin/python');
    expect(await pending).toMatchObject({ status: 'aborted' });
    manager.execute('2');
    expect(createSession.mock.calls[1][0].commands).toEqual(['/venv/bin/python']);
    expect(sessions).toHaveLength(2);
  });

  it('returns startup failures as tracebacks and retries later', async () => {
    const { manager, sessions } = setup();
    const result = manager.execute('1');
    sessions[0].calls[0].reject(new Error('ModuleNotFoundError: x'));
    expect((await result).outputs[0]).toMatchObject({ type: 'traceback', text: 'ModuleNotFoundError: x' });
    manager.execute('2');
    expect(sessions).toHaveLength(2);
  });

  it('reports a session factory that throws', async () => {
    const createSession = () => {
      throw new Error('EACCES');
    };
    const manager = createKernelManager({ scriptPath: '/r.py', createSession });
    expect(await manager.execute('1')).toMatchObject({ status: 'error' });
  });

  it('drops a session whose kernel died', async () => {
    const { manager, sessions } = setup();
    const result = manager.execute('1');
    sessions[0].calls[0].resolve({ status: 'error', kernelDied: true });
    await result;
    expect(sessions[0].stop).toHaveBeenCalled();
  });

  it('restarts and interrupts only a running kernel', async () => {
    const { manager, sessions, createSession } = setup();
    expect(await manager.restart()).toEqual({ status: 'ok' });
    expect(await manager.interrupt()).toEqual({ status: 'ok' });
    expect(createSession).not.toHaveBeenCalled();
    manager.execute('1');
    manager.restart();
    manager.interrupt().catch(() => {});
    expect(sessions[0].calls.map((call) => call.command)).toEqual(['execute', 'restart', 'interrupt']);
  });

  it('reports a failed restart', async () => {
    const { manager, sessions } = setup();
    manager.execute('1');
    const restart = manager.restart();
    sessions[0].calls[1].reject(new Error('no kernel'));
    expect(await restart).toMatchObject({ status: 'error' });
    expect(sessions[0].stop).toHaveBeenCalled();
  });

  it('stays running until the process has exited', async () => {
    const { manager, sessions } = setup();
    manager.execute('1');
    let exit;
    sessions[0].stop = () => new Promise((resolve) => (exit = resolve));
    const first = manager.shutdown();
    const second = vi.fn();
    manager.shutdown().then(second);
    await flush();
    expect(manager.isRunning()).toBe(true);
    expect(second).not.toHaveBeenCalled();
    exit();
    await first;
    await flush();
    expect(manager.isRunning()).toBe(false);
    expect(second).toHaveBeenCalled();
  });
});

describe('runAll', () => {
  const cells = [
    { id: 'a', code: '1' },
    { id: 'b', code: '2' },
    { id: 'c', code: '3' },
  ];
  const fake = (statuses, generations = () => 0) => ({
    execute: vi.fn(async () => ({ status: statuses.shift() })),
    getGeneration: generations,
  });

  it('stops after the first failure', async () => {
    const results = await runAll(fake(['ok', 'error', 'ok']), cells, '/a');
    expect(results).toEqual([
      { cellId: 'a', status: 'ok' },
      { cellId: 'b', status: 'error' },
    ]);
  });

  it('stops after a restart between cells', async () => {
    let calls = 0;
    const results = await runAll(fake(['ok', 'ok', 'ok'], () => calls++), cells);
    expect(results).toHaveLength(1);
  });
});
