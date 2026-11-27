import fs from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { describe, expect, it, vi } from 'vitest';

const require = createRequire(import.meta.url);
const handlersModule = require('../../electron/lib/ipc/registerKernelHandlers');
const { KERNEL_CHANNELS, registerKernelHandlers } = handlersModule;

const setup = () => {
  let pythonPath = null;
  const manager = {
    execute: vi.fn(async () => ({ status: 'ok' })),
    restart: vi.fn(async () => ({ status: 'ok' })),
    setPythonPath: vi.fn(async (value) => (pythonPath = value)),
    getPythonPath: () => pythonPath,
    getGeneration: () => 0,
  };
  const handlers = {};
  const choosePython = vi.fn(async () => null);
  registerKernelHandlers(
    { handle: (channel, listener) => (handlers[channel] = listener) },
    { isTrusted: (url) => url === 'app', registry: { forSender: () => manager }, choosePython },
  );
  const call = async (name, ...args) =>
    handlers[KERNEL_CHANNELS[name]]({ sender: {}, senderFrame: { url: 'app' } }, ...args);
  return { manager, handlers, call, choosePython };
};

describe('kernel IPC handlers', () => {
  it('rejects untrusted senders', () => {
    const { handlers, manager } = setup();
    Object.values(handlers).forEach((listener) =>
      expect(() => listener({ sender: {}, senderFrame: { url: 'https://evil' } })).toThrow('Untrusted'),
    );
    expect(manager.execute).not.toHaveBeenCalled();
  });

  it('runs cells in the deck folder', async () => {
    const { call, manager } = setup();
    const deck = path.resolve('/decks/a.xpyb');
    await call('runCell', { id: 'a', code: '1' }, deck);
    expect(manager.execute).toHaveBeenLastCalledWith('1', path.dirname(deck));
    expect(await call('runAllCells', [{ id: 'b', code: '2' }], 'relative.xpyb')).toEqual([
      { cellId: 'b', status: 'ok' },
    ]);
    expect(manager.execute).toHaveBeenLastCalledWith('2', undefined);
    await call('restartKernel');
    expect(manager.restart).toHaveBeenCalled();
  });

  it('validates cells', async () => {
    const { call } = setup();
    await expect(call('runCell', { id: 'a' })).rejects.toThrow('code');
    await expect(call('runAllCells', 'all')).rejects.toThrow('list');
    await expect(call('runAllCells', [null])).rejects.toThrow('code');
  });

  it('opens the dialog only when no path is given', async () => {
    const { call, manager, choosePython } = setup();
    expect(await call('setPythonPath')).toEqual({ pythonPath: null });
    expect(manager.setPythonPath).not.toHaveBeenCalled();
    await call('setPythonPath', null);
    expect(manager.setPythonPath).toHaveBeenCalledWith(null);
    await expect(call('setPythonPath', '/bin/sh')).rejects.toThrow('Python executable');
    choosePython.mockResolvedValueOnce('/bin/sh');
    await expect(call('setPythonPath')).rejects.toThrow('Python executable');
  });

  it('lists interpreters with the selection', async () => {
    const { call } = setup();
    expect(await call('detectInterpreters', null)).toEqual({ interpreters: [], pythonPath: null });
  });

  it('keeps preload channel names in sync', () => {
    const preload = fs.readFileSync(
      path.resolve(import.meta.dirname, '../../electron/preload.js'),
      'utf8',
    );
    Object.entries(KERNEL_CHANNELS).forEach(([name, channel]) => {
      expect(preload).toMatch(new RegExp(`${name}:.*'${channel}'`));
    });
  });
});
