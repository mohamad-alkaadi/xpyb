import { EventEmitter } from 'node:events';
import { createRequire } from 'node:module';
import { describe, expect, it, vi } from 'vitest';
import { flush } from './fakes.js';

const require = createRequire(import.meta.url);
const registryModule = require('../../electron/lib/kernel/kernelRegistry');
const { createKernelRegistry, quitAfterKernels } = registryModule;

const setup = () => {
  const manager = { running: true, isRunning: () => manager.running };
  manager.shutdown = vi.fn(async () => {
    manager.running = false;
  });
  const factory = vi.fn(() => manager);
  return { manager, factory, registry: createKernelRegistry(factory), sender: new EventEmitter() };
};

describe('kernel registry', () => {
  it('keeps one manager per window', () => {
    const { registry, factory, sender } = setup();
    expect(registry.forSender(sender)).toBe(registry.forSender(sender));
    expect(factory).toHaveBeenCalledTimes(1);
  });

  it('shuts down on reload and crash, not on in-page navigation', () => {
    const { registry, manager, sender } = setup();
    registry.forSender(sender);
    sender.emit('did-start-navigation', { isMainFrame: true, isSameDocument: true });
    sender.emit('did-start-navigation', { isMainFrame: false, isSameDocument: false });
    expect(manager.shutdown).not.toHaveBeenCalled();
    sender.emit('did-start-navigation', { isMainFrame: true, isSameDocument: false });
    sender.emit('render-process-gone');
    expect(manager.shutdown).toHaveBeenCalledTimes(2);
  });

  it('shuts down and forgets a closed window', async () => {
    const { registry, manager, factory, sender } = setup();
    registry.forSender(sender);
    sender.emit('destroyed');
    await flush();
    expect(manager.shutdown).toHaveBeenCalled();
    registry.forSender(sender);
    expect(factory).toHaveBeenCalledTimes(2);
  });

  it('delays quitting until kernels are gone', async () => {
    const { registry, sender } = setup();
    registry.forSender(sender);
    const app = Object.assign(new EventEmitter(), { quit: vi.fn() });
    quitAfterKernels(app, registry);
    const event = { preventDefault: vi.fn() };
    app.emit('will-quit', event);
    await flush();
    expect(event.preventDefault).toHaveBeenCalledTimes(1);
    expect(app.quit).toHaveBeenCalledTimes(1);
    app.emit('will-quit', event);
    expect(event.preventDefault).toHaveBeenCalledTimes(1);
  });
});
