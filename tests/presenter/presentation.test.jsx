// @vitest-environment jsdom
import { EditorView } from '@codemirror/view';
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { StrictMode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import App from '../../src/App.jsx';
import { codeCell, makeDeck, makeSlide, textCell } from '../layouts/fixtures.js';

const deck = () =>
  makeDeck([
    makeSlide('a', 'titleOnly', [textCell('t', 'Welcome')]),
    makeSlide('b', 'twoColumns', [
      textCell('h', 'Demo'),
      codeCell('c1', 'first()', { slot: 'left' }),
      textCell('o', '', { slot: 'right', mode: 'output', outputOf: 'c1' }),
    ]),
    makeSlide('c', 'titleAndBody', [textCell('h2', 'End'), codeCell('c2', 'second()')]),
  ]);
const ok = (text) => ({ status: 'ok', outputs: [{ type: 'stdout', text }] });

let pending;
const finish = async (result) => act(async () => pending.shift()(result));
const press = async (key, target = document.body, extra = {}) =>
  act(async () => {
    fireEvent.keyDown(target, { key, ...extra });
  });
const stage = () => within(screen.getByRole('region', { name: 'Presentation slide' }));
const open = async (search = '/?mode=present&file=%2Fa.xpyb') => {
  window.history.replaceState({}, '', search);
  render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
  await screen.findByRole('region', { name: 'Presentation slide' });
  await act(async () => {});
};
const compileAll = async () => {
  await open();
  await finish(ok('one'));
  await finish(ok('two'));
};

beforeEach(() => {
  pending = [];
  window.xpybApi = {
    openDeck: vi.fn(async (filePath) => ({ filePath, deck: deck() })),
    runCell: vi.fn(() => new Promise((resolve) => pending.push(resolve))),
    exitFullScreen: vi.fn(async () => {}),
    detectInterpreters: vi.fn(async () => ({ interpreters: [], pythonPath: null })),
  };
});
afterEach(() => {
  cleanup();
  delete window.xpybApi;
  window.history.replaceState({}, '', '/');
});

describe('pre-compile', () => {
  it('compiles every cell in order before showing slide 1', async () => {
    await open();
    expect(stage().getByRole('status').textContent).toBe('Compiling cell 1 of 2...');
    expect(window.xpybApi.runCell).toHaveBeenCalledTimes(1);
    await press('ArrowRight');
    expect(screen.queryByText('Welcome')).toBeNull();
    await finish(ok('one'));
    expect(stage().getByRole('status').textContent).toBe('Compiling cell 2 of 2...');
    expect(screen.getByRole('progressbar').value).toBe(1);
    expect(window.xpybApi.runCell.mock.calls[1][0]).toEqual({ id: 'c2', code: 'second()' });
    await finish(ok('two'));
    expect(stage().getByText('Welcome')).toBeTruthy();
    expect(window.xpybApi.runCell).toHaveBeenCalledTimes(2);
  });

  it('shows the slides when the bridge fails, with the error', async () => {
    window.xpybApi.runCell = vi.fn(async () => {
      throw new Error('bridge down');
    });
    await open();
    expect(stage().getByText('Welcome')).toBeTruthy();
    expect(screen.getByRole('alert').textContent).toBe('bridge down');
  });

  it('can be cancelled with Escape, running no further cells', async () => {
    await open();
    await press('Escape');
    expect(screen.getByRole('region', { name: 'Slide editor' })).toBeTruthy();
    await finish(ok('one'));
    expect(window.xpybApi.runCell).toHaveBeenCalledTimes(1);
  });
});

describe('navigation', () => {
  it('moves with the arrows and Space and shows cached outputs', async () => {
    await compileAll();
    await press('ArrowLeft');
    expect(stage().getByText('Welcome')).toBeTruthy();
    await press('ArrowRight');
    expect(stage().getByText('one')).toBeTruthy();
    await press(' ');
    await press(' ');
    expect(stage().getByText('End')).toBeTruthy();
    await press('ArrowLeft');
    expect(stage().getByText('Demo')).toBeTruthy();
    expect(stage().queryByRole('textbox')).toBeNull();
    expect(stage().queryByRole('button')).toBeNull();
    expect(window.xpybApi.runCell).toHaveBeenCalledTimes(2);
  });

  it('leaves full screen for the editor on Escape', async () => {
    await compileAll();
    await press('Escape');
    expect(screen.getByRole('region', { name: 'Slide editor' })).toBeTruthy();
    expect(window.xpybApi.exitFullScreen).toHaveBeenCalledTimes(1);
    await press('ArrowRight');
    expect(window.xpybApi.runCell).toHaveBeenCalledTimes(2);
  });
});

describe('live coding', () => {
  const unlock = async () => {
    await compileAll();
    await press('ArrowRight');
    await press('e');
    return stage().getByRole('textbox');
  };

  it('unlocks with E, focuses the editor and keeps typing keys inside it', async () => {
    const editor = await unlock();
    expect(document.activeElement).toBe(editor);
    await press(' ', editor);
    await press('ArrowRight', editor);
    expect(stage().getByText('Demo')).toBeTruthy();
    expect(stage().queryByRole('group', { name: /content type/ })).toBeNull();
  });

  it('re-runs the edited cell with Shift+Enter without recompiling', async () => {
    const editor = await unlock();
    const view = EditorView.findFromDOM(editor);
    act(() => view.dispatch({ changes: { from: 0, to: 7, insert: 'live()' } }));
    await press('Enter', editor, { code: 'Enter', shiftKey: true });
    expect(window.xpybApi.runCell).toHaveBeenLastCalledWith({ id: 'c1', code: 'live()' }, '/a.xpyb');
    await finish(ok('updated'));
    expect(stage().getByText('updated')).toBeTruthy();
    expect(window.xpybApi.runCell).toHaveBeenCalledTimes(3);
  });

  it('locks again on Escape and keeps the edit', async () => {
    const editor = await unlock();
    const view = EditorView.findFromDOM(editor);
    act(() => view.dispatch({ changes: { from: 0, to: 7, insert: 'kept()' } }));
    await press('Escape', editor);
    expect(stage().queryByRole('textbox')).toBeNull();
    expect(stage().getByText('kept', { exact: false })).toBeTruthy();
    expect(window.xpybApi.exitFullScreen).not.toHaveBeenCalled();
  });

  it('ignores E on a slide without code', async () => {
    await compileAll();
    await press('e');
    expect(stage().queryByRole('textbox')).toBeNull();
  });
});

describe('sync button', () => {
  const edit = async (result) => {
    window.xpybApi.openDeck = vi.fn(async (filePath) => ({
      filePath,
      deck: { ...deck(), sourceNotebook: '/a.ipynb' },
    }));
    window.xpybApi.syncNotebook = vi.fn(result);
    window.history.replaceState({}, '', '/?file=%2Fa.xpyb');
    render(<App />);
    await screen.findByText('3 slides');
    return screen.getByRole('button', { name: 'Sync from .ipynb' });
  };

  it('replaces the deck and reports the outcome', async () => {
    const synced = { ...deck(), slides: deck().slides.slice(0, 1) };
    const button = await edit(async () => ({ deck: synced, changedIds: [], added: 0, missing: 0 }));
    await act(async () => fireEvent.click(button));
    expect(screen.getByText('1 slide')).toBeTruthy();
    expect(screen.getByText('Synced: 0 updated, 0 added.')).toBeTruthy();
    expect(window.xpybApi.syncNotebook.mock.calls[0][1]).toBe('/a.xpyb');
  });

  it('keeps the deck and shows the error when syncing fails', async () => {
    const button = await edit(async () => {
      throw new Error('notebook missing');
    });
    await act(async () => fireEvent.click(button));
    expect(screen.getByRole('alert').textContent).toBe('notebook missing');
    expect(screen.getByText('3 slides')).toBeTruthy();
  });

  it('discards the result when the deck changed meanwhile', async () => {
    let done;
    const button = await edit(() => new Promise((resolve) => (done = resolve)));
    fireEvent.click(button);
    fireEvent.click(screen.getByRole('button', { name: 'Add slide' }));
    await act(async () => done({ deck: deck(), changedIds: [], added: 0, missing: 0 }));
    expect(screen.getByRole('alert').textContent).toContain('changed while syncing');
    expect(screen.getByText('4 slides')).toBeTruthy();
  });

  it('is disabled without a source notebook', async () => {
    window.history.replaceState({}, '', '/?file=%2Fa.xpyb');
    render(<App />);
    await screen.findByText('3 slides');
    expect(screen.getByRole('button', { name: 'Sync from .ipynb' }).disabled).toBe(true);
  });
});
