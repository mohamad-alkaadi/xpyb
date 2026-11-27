import { createRequire } from 'node:module';
import { describe, expect, it, vi } from 'vitest';
import { createChild, flush } from './fakes.js';

const require = createRequire(import.meta.url);
const { createRunnerSession } = require('../../electron/lib/kernel/runnerSession');

const start = (children = [createChild()], options = {}) => {
  const queue = [...children];
  const spawn = vi.fn(() => queue.shift());
  const session = createRunnerSession({ scriptPath: '/app/runner.py', spawn, ...options });
  return { session, spawn, child: children[0] };
};
const missing = (child) => child.emit('error', Object.assign(new Error('nope'), { code: 'ENOENT' }));

describe('runner session', () => {
  it('spawns python -u with the unmodified environment', () => {
    const { spawn } = start(undefined, { cwd: '/decks' });
    const [command, args, options] = spawn.mock.calls[0];
    expect([command, args]).toEqual(['python', ['-u', '/app/runner.py']]);
    expect(options.env).toBe(process.env);
    expect(options.cwd).toBe('/decks');
  });

  it('waits for ready, then matches results by id', async () => {
    const { session, child } = start();
    const first = session.request('execute', { code: '1' });
    const second = session.request('execute', { code: '2' });
    await flush();
    expect(child.sent).toEqual([]);
    child.send({ type: 'ready' });
    await flush();
    expect(child.sent.map((message) => message.code)).toEqual(['1', '2']);
    child.send({ type: 'result', id: child.sent[1].id, status: 'ok' });
    child.send({ type: 'result', id: child.sent[0].id, status: 'error' });
    expect(await first).toEqual({ status: 'error' });
    expect(await second).toEqual({ status: 'ok' });
  });

  it('falls back to python3', async () => {
    const children = [createChild(undefined), createChild()];
    children[0].pid = undefined;
    const { session, spawn } = start(children);
    missing(children[0]);
    children[0].emit('close', -2);
    expect(spawn.mock.calls[1][0]).toBe('python3');
    children[1].send({ type: 'ready' });
    await flush();
    expect(session.isAlive()).toBe(true);
  });

  it('does not fall back from a custom interpreter', async () => {
    const child = createChild();
    child.pid = undefined;
    const { session, spawn } = start([child], { commands: ['/venv/bin/python'] });
    const request = session.request('execute');
    missing(child);
    await expect(request).rejects.toThrow('Could not start Python "/venv/bin/python"');
    expect(spawn).toHaveBeenCalledTimes(1);
    expect(session.isAlive()).toBe(false);
  });

  it('starts no fallback after being stopped', async () => {
    const child = createChild();
    child.pid = undefined;
    const { session, spawn } = start([child]);
    const stopped = session.stop();
    missing(child);
    await stopped;
    expect(spawn).toHaveBeenCalledTimes(1);
  });

  it('reports the Python traceback when the runner exits', async () => {
    const { session, child } = start();
    const request = session.request('execute');
    child.stderr.write("ModuleNotFoundError: No module named 'jupyter_client'\n");
    await flush();
    child.emit('close', 1);
    await expect(request).rejects.toThrow("No module named 'jupyter_client'");
    await expect(session.request('execute')).rejects.toThrow('jupyter_client');
  });

  it('shuts down gracefully', async () => {
    const { session, child } = start();
    const stopped = session.stop();
    await flush();
    expect(child.sent).toEqual([{ command: 'shutdown' }]);
    expect(child.stdin.writableEnded).toBe(true);
    child.emit('close', 0);
    await stopped;
    expect(child.kill).not.toHaveBeenCalled();
  });

  it('kills a runner that does not exit', async () => {
    const { session, child } = start(undefined, { killDelay: 5 });
    await session.stop();
    expect(child.kill).toHaveBeenCalledWith('SIGKILL');
  });
});
