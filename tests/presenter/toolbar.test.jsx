// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import App from '../../src/App.jsx';
import { isSaveShortcut } from '../../src/lib/deck/saveShortcut.js';
import { listInterpreterOptions, toPythonPath } from '../../src/lib/kernel/interpreterOptions.js';
import { codeCell, makeDeck, makeSlide } from '../layouts/fixtures.js';

const deck = () => makeDeck([makeSlide('a', 'titleAndBody', [codeCell('c', 'print(1)')])]);
const venv = '/d/.venv/bin/python';

const open = async () => {
  render(<App />);
  await screen.findByText('1 slide');
};
const button = (name) => screen.getByRole('button', { name });
const click = async (name) => act(async () => fireEvent.click(button(name)));
const keyDown = async (key, extra, target = document.body) => {
  let isAllowed;
  await act(async () => {
    isAllowed = fireEvent.keyDown(target, { key, ...extra });
  });
  return isAllowed;
};
const isDirty = () => Boolean(screen.queryByText('● Unsaved changes'));

beforeEach(() => {
  window.history.replaceState({}, '', '/?file=%2Fd%2Fa.xpyb');
  window.xpybApi = {
    openDeck: vi.fn(async (filePath) => ({ filePath, deck: deck() })),
    saveDeck: vi.fn(async (filePath) => ({ filePath })),
    runCell: vi.fn(async () => ({ status: 'ok', outputs: [] })),
    enterFullScreen: vi.fn(async () => {}),
    exitFullScreen: vi.fn(async () => {}),
    detectInterpreters: vi.fn(async () => ({
      interpreters: [{ label: '.venv', path: venv }],
      pythonPath: null,
    })),
    setPythonPath: vi.fn(async (pythonPath = '/opt/python3') => ({ pythonPath })),
  };
});
afterEach(() => {
  cleanup();
  delete window.xpybApi;
  window.history.replaceState({}, '', '/');
});

describe('saving', () => {
  it('shows unsaved changes and clears them after a save', async () => {
    await open();
    expect(isDirty()).toBe(false);
    expect(button('Save').disabled).toBe(true);
    await click('Add slide');
    expect(isDirty()).toBe(true);
    await click('Save');
    expect(isDirty()).toBe(false);
    const [filePath, saved] = window.xpybApi.saveDeck.mock.calls[0];
    expect([filePath, saved.slides.length]).toEqual(['/d/a.xpyb', 2]);
  });

  it('does not mark selecting a slide as a change', async () => {
    await open();
    await click('Slide 1');
    expect(isDirty()).toBe(false);
  });

  it.each([{ ctrlKey: true }, { metaKey: true }])('saves with the shortcut %j', async (modifier) => {
    await open();
    await click('Add slide');
    const editor = screen.getByRole('main').querySelector('.cm-content') || document.body;
    expect(await keyDown('s', modifier, editor)).toBe(false);
    expect(window.xpybApi.saveDeck).toHaveBeenCalledTimes(1);
    expect(isDirty()).toBe(false);
  });

  it('stays unsaved and shows the error when writing fails', async () => {
    window.xpybApi.saveDeck.mockRejectedValueOnce(new Error('disk full'));
    await open();
    await click('Add slide');
    await click('Save');
    expect(screen.getByRole('alert').textContent).toBe('disk full');
    expect(isDirty()).toBe(true);
  });

  it('writes once at a time and keeps edits made during a write unsaved', async () => {
    let done;
    window.xpybApi.saveDeck = vi.fn(() => new Promise((resolve) => (done = resolve)));
    await open();
    await click('Add slide');
    await keyDown('s', { ctrlKey: true });
    await keyDown('s', { ctrlKey: true });
    expect(button('Saving…').disabled).toBe(true);
    await click('Add slide');
    await act(async () => done({}));
    expect(window.xpybApi.saveDeck).toHaveBeenCalledTimes(1);
    expect(isDirty()).toBe(true);
    expect(screen.queryByText('Loading…')).toBeNull();
  });

  it('stays saved when a sync changes nothing', async () => {
    window.xpybApi.openDeck = vi.fn(async (filePath) => ({
      filePath,
      deck: { ...deck(), sourceNotebook: '/d/a.ipynb' },
    }));
    window.xpybApi.syncNotebook = vi.fn(async (current) => ({
      deck: structuredClone(current),
      changedIds: [],
      added: 0,
      missing: 0,
    }));
    await open();
    await click('Sync from .ipynb');
    expect(isDirty()).toBe(false);
  });

  it('recognises only Ctrl+S and Cmd+S', () => {
    const press = (extra) => isSaveShortcut({ key: 's', ...extra });
    expect([press({ ctrlKey: true }), press({ metaKey: true, key: 'S' })]).toEqual([true, true]);
    expect(press({})).toBeFalsy();
    expect(press({ ctrlKey: true, shiftKey: true })).toBe(false);
    expect(press({ ctrlKey: true, altKey: true })).toBe(false);
  });
});

describe('Present button', () => {
  it('compiles, presents in full screen from slide 1 and returns with Escape', async () => {
    await open();
    await click('Add slide');
    await click('Present');
    expect(window.xpybApi.enterFullScreen).toHaveBeenCalledTimes(1);
    expect(window.xpybApi.runCell).toHaveBeenCalledTimes(1);
    const stage = within(screen.getByRole('region', { name: 'Presentation slide' }));
    expect(stage.getByText('print', { exact: false })).toBeTruthy();
    await keyDown('Escape');
    expect(isDirty()).toBe(true);
    await click('Present');
    expect(window.xpybApi.runCell).toHaveBeenCalledTimes(2);
  });

  it('is disabled for a deck without slides', async () => {
    window.xpybApi.openDeck = vi.fn(async (filePath) => ({ filePath, deck: makeDeck([]) }));
    render(<App />);
    await screen.findByText('0 slides');
    expect(button('Present').disabled).toBe(true);
  });
});

describe('interpreter picker', () => {
  const menu = () => screen.getByRole('combobox', { name: 'Python' });
  const choose = async (value) => act(async () => fireEvent.change(menu(), { target: { value } }));

  it('offers environments beside the deck and applies the choice', async () => {
    await open();
    expect(window.xpybApi.detectInterpreters).toHaveBeenCalledWith('/d/a.xpyb');
    await screen.findByRole('option', { name: '.venv' });
    expect(menu().value).toBe('');
    await choose(venv);
    expect(window.xpybApi.setPythonPath).toHaveBeenLastCalledWith(venv);
    expect(menu().value).toBe(venv);
    await choose('');
    expect(window.xpybApi.setPythonPath).toHaveBeenLastCalledWith(null);
  });

  it('shows an interpreter chosen with the file dialog', async () => {
    await open();
    await choose('browse');
    expect(window.xpybApi.setPythonPath).toHaveBeenLastCalledWith(undefined);
    expect(menu().value).toBe('/opt/python3');
  });

  it('maps menu values', () => {
    expect(listInterpreterOptions([], null).map((option) => option.value)).toEqual(['', 'browse']);
    expect(['browse', '', venv].map(toPythonPath)).toEqual([undefined, null, venv]);
  });
});
