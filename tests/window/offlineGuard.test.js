import { createRequire } from 'node:module';
import { describe, expect, it, vi } from 'vitest';

const require = createRequire(import.meta.url);
const guard = require('../../electron/lib/window/offlineGuard');

describe('offline guard', () => {
  it.each([
    ['file:///app/index.html', true],
    ['data:text/plain,a', true],
    ['blob:file:///id', true],
    ['file://server/share', false],
    ['https://example.com', false],
    ['ws://localhost:1', false],
    ['not a url', false],
  ])('classifies %s', (url, expected) => {
    expect(guard.isLocalUrl(url)).toBe(expected);
  });

  it('cancels network requests', () => {
    const onBeforeRequest = vi.fn();
    guard.blockNetwork({ webRequest: { onBeforeRequest } });
    const callback = vi.fn();
    onBeforeRequest.mock.calls[0][0]({ url: 'https://example.com' }, callback);
    expect(callback).toHaveBeenCalledWith({ cancel: true });
  });

  it('blocks navigation and new windows', () => {
    const contents = { on: vi.fn(), setWindowOpenHandler: vi.fn() };
    guard.lockNavigation(contents);
    const event = { preventDefault: vi.fn() };
    contents.on.mock.calls[0][1](event);
    expect(event.preventDefault).toHaveBeenCalled();
    expect(contents.setWindowOpenHandler.mock.calls[0][0]()).toEqual({ action: 'deny' });
  });
});
