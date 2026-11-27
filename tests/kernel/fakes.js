import { EventEmitter } from 'node:events';
import { PassThrough } from 'node:stream';
import { vi } from 'vitest';

export const createChild = (pid = 1) => {
  const child = new EventEmitter();
  Object.assign(child, { pid, stdin: new PassThrough(), stdout: new PassThrough() });
  child.stderr = new PassThrough();
  child.kill = vi.fn(() => child.emit('close', null));
  child.sent = [];
  child.stdin.on('data', (data) => {
    String(data).trim().split('\n').forEach((line) => child.sent.push(JSON.parse(line)));
  });
  child.send = (message) => child.stdout.write(`${JSON.stringify(message)}\n`);
  return child;
};

export const flush = () => new Promise((resolve) => setImmediate(resolve));

export const createFakeSession = () => {
  const session = { alive: true, calls: [] };
  session.isAlive = () => session.alive;
  session.request = vi.fn(
    (command, payload) =>
      new Promise((resolve, reject) => session.calls.push({ command, payload, resolve, reject })),
  );
  session.stop = vi.fn(async () => {
    session.alive = false;
    session.calls.forEach((call) => call.reject(new Error('stopped')));
  });
  return session;
};
