import { createRequire } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it, vi } from 'vitest';
import { getPresenterAction } from '../../src/lib/presentation/keys.js';
import { describeProgress, precompileCells } from '../../src/lib/presentation/precompile.js';
import { findEditableCellId, stepSlide } from '../../src/lib/presentation/slides.js';
import { codeCell, makeSlide, textCell } from '../layouts/fixtures.js';

const require = createRequire(import.meta.url);
const windows = require('../../electron/lib/ipc/registerWindowHandlers');
const { watchOpenFile } = require('../../electron/lib/window/openFile');

const cells = [
  { id: 'a', code: '1' },
  { id: 'b', code: '2' },
  { id: 'c', code: '3' },
];
const hooks = (run, isCancelled = () => false) => ({ run, isCancelled, onProgress: vi.fn() });

describe('precompileCells', () => {
  it('runs cells one at a time and continues past cell errors', async () => {
    const log = [];
    const run = async (id) => {
      log.push(`start ${id}`);
      await Promise.resolve();
      log.push(`end ${id}`);
      return [{ status: 'error', outputs: [{ ename: 'ValueError' }] }];
    };
    const options = hooks(run);
    await precompileCells(cells, options);
    expect(log).toEqual(['start a', 'end a', 'start b', 'end b', 'start c', 'end c']);
    expect(options.onProgress.mock.calls).toEqual([[0], [1], [2]]);
  });

  it.each([
    ['the bridge rejects', null],
    ['Python cannot start', [{ outputs: [{ ename: 'KernelError' }] }]],
  ])('stops when %s', async (_, finished) => {
    const run = vi.fn(async () => finished);
    await precompileCells(cells, hooks(run));
    expect(run).toHaveBeenCalledTimes(1);
  });

  it('stops once cancelled', async () => {
    const run = vi.fn(async () => []);
    await precompileCells(cells, hooks(run, () => run.mock.calls.length === 2));
    expect(run).toHaveBeenCalledTimes(2);
  });

  it('describes progress', () => {
    expect(describeProgress({ done: 0, total: 3 })).toBe('Compiling cell 1 of 3...');
    expect(describeProgress({ done: 3, total: 3 })).toBe('Compiling cell 3 of 3...');
  });
});

describe('presentation keys', () => {
  const press = (key, extra = {}) => getPresenterAction({ key, target: null, ...extra });
  const inside = (selector) => ({ closest: (query) => query.split(', ').includes(selector) });

  it('maps the shortcuts', () => {
    expect(['ArrowRight', ' ', 'ArrowLeft', 'Escape', 'e', 'E', 'Enter'].map((k) => press(k))).toEqual(
      ['next', 'next', 'previous', 'escape', 'unlock', 'unlock', null],
    );
  });

  it('leaves typing, handled keys and shortcuts with modifiers alone', () => {
    const editor = inside('[contenteditable="true"]');
    expect(press(' ', { target: editor })).toBeNull();
    expect(press('e', { target: editor })).toBeNull();
    expect(press('Escape', { target: editor })).toBe('escape');
    expect(press('Escape', { defaultPrevented: true })).toBeNull();
    expect(press('e', { ctrlKey: true })).toBeNull();
    expect(press(' ', { target: inside('button') })).toBeNull();
    expect(press('ArrowRight', { target: inside('button') })).toBe('next');
  });
});

describe('slide navigation', () => {
  it('stays inside the deck', () => {
    expect([stepSlide(0, -1, 3), stepSlide(1, 1, 3), stepSlide(2, 1, 3), stepSlide(0, 1, 0)]).toEqual(
      [0, 2, 2, 0],
    );
  });

  it('unlocks the first code cell in layout order', () => {
    const slide = makeSlide('s', 'twoColumns', [
      codeCell('r', '2', { slot: 'right' }),
      codeCell('l', '1', { slot: 'left' }),
    ]);
    expect(findEditableCellId(slide)).toBe('l');
    expect(findEditableCellId(makeSlide('t', 'titleAndBody', [textCell('x', 'hi')]))).toBeNull();
    expect(findEditableCellId(undefined)).toBeNull();
  });
});

describe('main process helpers', () => {
  it('changes full screen only for the app page', async () => {
    const handle = vi.fn();
    const window = { setFullScreen: vi.fn() };
    windows.registerWindowHandlers({ handle }, (url) => url === 'app', () => window);
    handle.mock.calls.forEach(([, listener]) => {
      expect(() => listener({ senderFrame: { url: 'x' } })).toThrow('Untrusted');
      listener({ senderFrame: { url: 'app' } });
    });
    expect(window.setFullScreen.mock.calls).toEqual([[true], [false]]);
    const preload = path.resolve(import.meta.dirname, '../../electron/preload.js');
    const text = fs.readFileSync(preload, 'utf8');
    Object.values(windows.WINDOW_CHANNELS).forEach((name) => expect(text).toContain(`'${name}'`));
  });

  it('keeps an early opened file and opens later ones in new windows', () => {
    const app = { on: vi.fn() };
    const open = vi.fn();
    const watcher = watchOpenFile(app, open);
    const send = (file) => app.on.mock.calls[0][1]({ preventDefault: vi.fn() }, file);
    send('/early.xpyb');
    expect(watcher.start()).toEqual({ mode: 'editor', filePath: '/early.xpyb' });
    send('/notes.txt');
    send('/later.xpyb');
    expect(open.mock.calls).toEqual([[{ mode: 'editor', filePath: '/later.xpyb' }]]);
  });
});
