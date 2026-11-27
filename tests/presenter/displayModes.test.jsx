// @vitest-environment jsdom
import { EditorView } from '@codemirror/view';
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { StrictMode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import App from '../../src/App.jsx';
import { REVEAL_MS } from '../../src/context/useModeReveal.js';
import { codeCell, makeDeck, makeSlide, textCell } from '../layouts/fixtures.js';

const deck = () =>
  makeDeck([
    makeSlide('a', 'titleAndBody', [textCell('h', 'Single'), codeCell('c1', 'first()')]),
    makeSlide('b', 'twoColumns', [
      textCell('h2', 'Double'),
      codeCell('c2', 'second()', { slot: 'left' }),
      codeCell('c3', 'third()', { slot: 'right' }),
    ]),
  ]);
const OUTPUTS = {
  c1: [{ type: 'stdout', text: 'one' }],
  c2: [{ type: 'traceback', text: 'ValueError: two' }],
  c3: [],
};

const stage = () => within(screen.getByRole('region', { name: 'Presentation slide' }));
const code = (name) => stage().queryByText(`${name}()`, { selector: 'pre span' });
const press = async (key, target = document.body, extra = {}) =>
  act(async () => {
    fireEvent.keyDown(target, { key, ...extra });
  });
const click = async (element) => act(async () => fireEvent.click(element));
const button = (name) => screen.getByRole('button', { name });
const bar = () => screen.getByRole('group', { name: 'Presentation display mode' });
const isRevealed = () => bar().dataset.revealed === 'true';
const choose = (name) => click(within(bar()).getByRole('button', { name }));
const open = async () => {
  window.history.replaceState({}, '', '/?mode=present&file=%2Fa.xpyb');
  render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
  await screen.findByText('Single');
  await act(async () => {});
};

beforeEach(() => {
  window.xpybApi = {
    openDeck: vi.fn(async (filePath) => ({ filePath, deck: deck() })),
    runCell: vi.fn(async ({ id }) => ({ status: 'ok', outputs: OUTPUTS[id] })),
    exitFullScreen: vi.fn(async () => {}),
    detectInterpreters: vi.fn(async () => ({ interpreters: [], pythonPath: null })),
  };
});
afterEach(() => {
  cleanup();
  vi.useRealTimers();
  delete window.xpybApi;
  window.history.replaceState({}, '', '/');
});

describe('top hover bar', () => {
  it('stays hidden until the pointer reaches the top edge', async () => {
    await open();
    expect(isRevealed()).toBe(false);
    expect(bar().className).toContain('opacity-0');
    fireEvent.mouseOver(screen.getByTestId('mode-hot-zone'));
    expect(isRevealed()).toBe(true);
    expect(bar().className).toContain('opacity-100');
    fireEvent.mouseOut(screen.getByTestId('mode-hot-zone'));
    expect(isRevealed()).toBe(false);
  });

  it('switches between the three modes', async () => {
    await open();
    const pressed = () => within(bar()).getByRole('button', { pressed: true }).textContent;
    expect(pressed()).toBe('Hover Button');
    await choose('Code / Output Tabs');
    expect(pressed()).toBe('Code / Output Tabs');
    expect(stage().getByRole('tablist')).toBeTruthy();
    await choose('Picture-in-Picture');
    expect(stage().queryByRole('tablist')).toBeNull();
    expect(stage().getByTestId('pip-card')).toBeTruthy();
    await choose('Hover Button');
    expect(stage().queryByTestId('pip-card')).toBeNull();
    expect(button('Show Output')).toBeTruthy();
  });

  it('does not take focus from the slides when clicked', async () => {
    await open();
    expect(fireEvent.mouseDown(button('Code / Output Tabs'))).toBe(false);
  });

  it('cycles with M and hides again after a moment', async () => {
    await open();
    vi.useFakeTimers();
    await press('m');
    expect(isRevealed()).toBe(true);
    expect(stage().getByRole('tablist')).toBeTruthy();
    act(() => vi.advanceTimersByTime(REVEAL_MS - 1));
    await press('M');
    expect(stage().getByTestId('pip-card')).toBeTruthy();
    act(() => vi.advanceTimersByTime(REVEAL_MS - 1));
    expect(isRevealed()).toBe(true);
    act(() => vi.advanceTimersByTime(1));
    expect(isRevealed()).toBe(false);
    await press('m');
    expect(button('Show Output')).toBeTruthy();
  });
});

describe('hover button mode', () => {
  it('pairs a single code slot with its compiled output', async () => {
    await open();
    expect(code('first')).toBeTruthy();
    expect(stage().queryByText('one')).toBeNull();
    await click(button('Show Output'));
    expect(stage().getByText('one')).toBeTruthy();
    expect(code('first')).toBeNull();
    await click(button('Show Code'));
    expect(code('first')).toBeTruthy();
  });

  it('toggles every code cell of the slide with O', async () => {
    await open();
    await press('ArrowRight');
    await press('o');
    expect(stage().getByText('ValueError: two')).toBeTruthy();
    expect(stage().getByText('No output.')).toBeTruthy();
    await press('O');
    expect(code('second')).toBeTruthy();
    expect(code('third')).toBeTruthy();
  });

  it('starts each slide on its code, but keeps the view at the end of the deck', async () => {
    await open();
    await press('o');
    await press('ArrowLeft');
    expect(stage().getByText('one')).toBeTruthy();
    await press('ArrowRight');
    await press('ArrowLeft');
    expect(code('first')).toBeTruthy();
  });

  it('ignores O in the other modes', async () => {
    await open();
    await choose('Code / Output Tabs');
    await press('o');
    expect(code('first')).toBeTruthy();
  });
});

describe('tabs mode', () => {
  const tab = (name) => stage().getByRole('tab', { name: new RegExp(`^${name}`) });

  it('switches between code and output, badging ready output', async () => {
    await open();
    await press('m');
    expect(tab('Code').getAttribute('aria-selected')).toBe('true');
    expect(within(tab('Output')).getByRole('img', { name: 'Output ready' })).toBeTruthy();
    await click(tab('Output'));
    expect(tab('Output').getAttribute('aria-selected')).toBe('true');
    expect(stage().getByText('one')).toBeTruthy();
    await click(tab('Code'));
    expect(code('first')).toBeTruthy();
  });

  it('badges errors and omits the badge without output', async () => {
    await open();
    await press('m');
    await press('ArrowRight');
    expect(stage().getAllByRole('img').map((dot) => dot.getAttribute('aria-label'))).toEqual([
      'Error ready',
    ]);
  });
});

describe('picture-in-picture mode', () => {
  const primary = () => within(stage().getByTestId('pip-primary'));
  const card = () => within(stage().getByTestId('pip-card'));

  it('swaps the large view and the 260x150 card on click', async () => {
    await open();
    await choose('Picture-in-Picture');
    const { width, height } = stage().getByTestId('pip-card').style;
    expect([width, height]).toEqual(['260px', '150px']);
    expect(primary().getByText('first()')).toBeTruthy();
    expect(card().getByText('one')).toBeTruthy();
    await click(button('Enlarge Output'));
    expect(primary().getByText('one')).toBeTruthy();
    expect(card().getByText('first()')).toBeTruthy();
    await click(button('Enlarge Code'));
    expect(primary().getByText('first()')).toBeTruthy();
    expect(card().getByText('one')).toBeTruthy();
  });

  it('swaps one cell without touching its neighbour', async () => {
    await open();
    await choose('Picture-in-Picture');
    await press('ArrowRight');
    await click(screen.getAllByRole('button', { name: 'Enlarge Output' })[0]);
    const views = stage().getAllByTestId('pip-primary').map((node) => node.dataset.view);
    expect(views).toEqual(['output', 'code']);
  });
});

describe.each(['Hover Button', 'Code / Output Tabs', 'Picture-in-Picture'])(
  'live coding in %s mode',
  (name) => {
    const showOutput = async () => {
      if (name === 'Hover Button') return click(button('Show Output'));
      if (name === 'Picture-in-Picture') return click(button('Enlarge Output'));
      return click(stage().getByRole('tab', { name: /^Output/ }));
    };

    it('unlocks with E from the output view and re-runs with Shift+Enter', async () => {
      await open();
      await choose(name);
      await showOutput();
      expect(stage().queryByRole('textbox')).toBeNull();
      await press('e');
      const editor = stage().getByRole('textbox');
      expect(document.activeElement).toBe(editor);
      const view = EditorView.findFromDOM(editor);
      act(() => view.dispatch({ changes: { from: 0, to: 7, insert: 'live()' } }));
      window.xpybApi.runCell.mockResolvedValueOnce({
        status: 'ok',
        outputs: [{ type: 'stdout', text: 'updated' }],
      });
      await press('Enter', editor, { code: 'Enter', shiftKey: true });
      expect(window.xpybApi.runCell).toHaveBeenLastCalledWith(
        { id: 'c1', code: 'live()' },
        '/a.xpyb',
      );
      await showOutput();
      expect(stage().getByText('updated')).toBeTruthy();
    });
  },
);
