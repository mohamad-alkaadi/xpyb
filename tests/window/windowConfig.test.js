import { createRequire } from 'node:module';
import { describe, expect, it } from 'vitest';

const require = createRequire(import.meta.url);
const config = require('../../electron/lib/window/windowConfig');

describe('window config', () => {
  it('reads packaged and unpackaged argument lists', () => {
    expect(config.getLaunchRequest(['electron', '/app', '/a.xpyb'], true, '/')).toEqual({
      mode: 'editor',
      filePath: '/a.xpyb',
    });
    expect(config.getLaunchRequest(['xpyb', '--no-sandbox', 'present', 'a.xpyb'], false, '/w')).toEqual(
      { mode: 'present', filePath: '/w/a.xpyb' },
    );
    expect(config.getLaunchRequest(['electron', '.'], true, '/').filePath).toBeNull();
  });

  it('rejects convert in the desktop process', () => {
    expect(() => config.getLaunchRequest(['x', 'convert', 'a.ipynb'], false, '/')).toThrow(
      'command line',
    );
  });

  it('builds the renderer query', () => {
    expect(config.toQuery({ mode: 'editor', filePath: null })).toEqual({ mode: 'editor' });
    expect(config.toQuery({ mode: 'present', filePath: '/a.xpyb' })).toEqual({
      mode: 'present',
      file: '/a.xpyb',
    });
  });

  it('uses full screen only for presenting and keeps the renderer isolated', () => {
    expect(config.getWindowOptions('present', '/p.js').fullscreen).toBe(true);
    const options = config.getWindowOptions('editor', '/p.js');
    expect(options.fullscreen).toBe(false);
    expect(options.webPreferences).toMatchObject({
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      spellcheck: false,
    });
  });
});
