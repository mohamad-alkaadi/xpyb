// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import * as api from '../../src/lib/ipc/xpybApi.js';

afterEach(() => {
  delete window.xpybApi;
});

describe('xpybApi wrappers', () => {
  it('fails clearly without the bridge', async () => {
    await expect(api.openDeck('/a.xpyb')).rejects.toThrow('bridge is not available');
  });

  it('forwards arguments to the bridge', async () => {
    window.xpybApi = { openDeck: vi.fn(), saveDeck: vi.fn(), convertNotebook: vi.fn() };
    await api.openDeck('/a.xpyb');
    await api.saveDeck('/a.xpyb', { slides: [] });
    await api.convertNotebook('/a.ipynb');
    expect(window.xpybApi.openDeck).toHaveBeenCalledWith('/a.xpyb');
    expect(window.xpybApi.saveDeck).toHaveBeenCalledWith('/a.xpyb', { slides: [] });
    expect(window.xpybApi.convertNotebook).toHaveBeenCalledWith('/a.ipynb');
  });
});
