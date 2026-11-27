import fs from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { describe, expect, it, vi } from 'vitest';

const require = createRequire(import.meta.url);
const { CHANNELS, registerHandlers } = require('../../electron/lib/ipc/registerHandlers');

describe('IPC handlers', () => {
  it('registers the three deck channels', () => {
    const handle = vi.fn();
    registerHandlers({ handle }, () => true);
    expect(handle.mock.calls.map(([channel]) => channel)).toEqual(Object.values(CHANNELS));
  });

  it('rejects untrusted senders and forwards trusted ones', async () => {
    const handle = vi.fn();
    registerHandlers({ handle }, (url) => url === 'file:///app');
    const open = handle.mock.calls[0][1];
    expect(() => open({ senderFrame: { url: 'https://evil.test' } }, '/a.xpyb')).toThrow('Untrusted');
    expect(() => open({ senderFrame: null }, '/a.xpyb')).toThrow('Untrusted');
    await expect(open({ senderFrame: { url: 'file:///app' } }, 'a.xpyb')).rejects.toThrow('absolute');
  });

  it('keeps preload channel names in sync', () => {
    const preload = fs.readFileSync(
      path.resolve(import.meta.dirname, '../../electron/preload.js'),
      'utf8',
    );
    Object.values(CHANNELS).forEach((channel) => expect(preload).toContain(`'${channel}'`));
  });
});
