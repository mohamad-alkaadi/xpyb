// @vitest-environment jsdom
import { EditorView } from '@codemirror/view';
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import App from '../../src/App.jsx';
import PythonEditor from '../../src/components/common/code/PythonEditor.jsx';
import ImageOutput from '../../src/components/slides/ImageOutput.jsx';
import { TRANSPARENT_THEME_SPEC } from '../../src/lib/slides/codeTheme.js';
import { codeCell, makeDeck, makeSlide, textCell } from '../layouts/fixtures.js';

const deck = () =>
  makeDeck([
    makeSlide('a', 'twoColumns', [
      textCell('t', 'Heading'),
      codeCell('c', 'print(1)', { slot: 'left' }),
      textCell('o', '', { slot: 'right', mode: 'output', outputOf: 'c' }),
    ]),
  ]);
const ok = (outputs) => ({ status: 'ok', outputs });

const open = async () => {
  render(<App />);
  await screen.findByText('1 slide');
  return within(screen.getByRole('region', { name: 'Slide editor' }));
};
const slot = (id) => within(screen.getByRole('main').querySelector(`[data-slot="${id}"]`));
const editorView = (stage) => EditorView.findFromDOM(stage.getByRole('textbox'));
const shiftEnter = (stage) =>
  act(async () => {
    fireEvent.keyDown(stage.getByRole('textbox'), { key: 'Enter', code: 'Enter', shiftKey: true });
  });

beforeEach(() => {
  window.history.replaceState({}, '', '/?file=%2Fa.xpyb');
  window.xpybApi = {
    openDeck: vi.fn(async (filePath) => ({ filePath, deck: deck() })),
    runCell: vi.fn(async () => ok([{ type: 'stdout', text: 'live\n' }])),
  };
  URL.createObjectURL = vi.fn(() => 'blob:plot');
  URL.revokeObjectURL = vi.fn();
});
afterEach(() => {
  cleanup();
  delete window.xpybApi;
  window.history.replaceState({}, '', '/');
});

describe('transparent editor theme', () => {
  it('has no opaque background', () => {
    expect(TRANSPARENT_THEME_SPEC['&'].backgroundColor).toBe('transparent');
    expect(TRANSPARENT_THEME_SPEC['.cm-gutters'].backgroundColor).toBe('transparent');
  });

  it.each([true, false])('configures CodeMirror for dark=%s', (isDark) => {
    render(<PythonEditor label="Code" value="x" isDark={isDark} fontSize={20} />);
    const view = EditorView.findFromDOM(screen.getByRole('textbox'));
    expect(view.state.facet(EditorView.darkTheme)).toBe(isDark);
    expect(getComputedStyle(view.dom).backgroundColor).toBe('rgba(0, 0, 0, 0)');
  });
});

describe('code style toolbar', () => {
  it('tints the backdrop and switches auto-contrast', async () => {
    await open();
    const surface = () => slot('left').getByTestId('code-surface');
    expect(surface().style.backgroundColor).toBe('transparent');
    expect(surface().style.color).toBe('rgb(0, 0, 0)');
    const slider = screen.getByRole('slider', { name: /Code backdrop/ });
    expect([slider.min, slider.max]).toEqual(['0', '80']);
    fireEvent.change(slider, { target: { value: '80' } });
    expect(surface().style.backgroundColor).toBe('rgba(0, 0, 0, 0.8)');
    expect(surface().style.color).toBe('rgb(255, 255, 255)');
    expect(surface().dataset.tone).toBe('dark');
    fireEvent.change(screen.getByRole('combobox', { name: 'Tint' }), { target: { value: 'light' } });
    expect(surface().style.backgroundColor).toBe('rgba(255, 255, 255, 0.8)');
    fireEvent.click(screen.getByRole('checkbox', { name: 'Auto-contrast code text' }));
    expect(surface().style.color).toBe('');
    expect(slot('right').getByTestId('code-surface').dataset.tone).toBe('light');
  });
});

describe('running cells', () => {
  it('runs from the button and updates the bound output slot', async () => {
    const stage = await open();
    expect(slot('right').getByText('42')).toBeTruthy();
    let finish;
    window.xpybApi.runCell.mockImplementationOnce(() => new Promise((done) => (finish = done)));
    const button = stage.getByRole('button', { name: 'Run Left column code' });
    fireEvent.click(button);
    expect(slot('right').getByRole('status').textContent).toBe('Running…');
    expect(button.disabled).toBe(true);
    await act(async () => finish(ok([{ type: 'stdout', text: 'live\n' }])));
    expect(slot('right').getByText('live')).toBeTruthy();
    expect(window.xpybApi.runCell).toHaveBeenCalledWith({ id: 'c', code: 'print(1)' }, '/a.xpyb');
  });

  it('runs the current text with Shift+Enter without inserting a line', async () => {
    const stage = await open();
    act(() => editorView(stage).dispatch({ changes: { from: 0, to: 8, insert: 'print(2)' } }));
    await shiftEnter(stage);
    expect(window.xpybApi.runCell).toHaveBeenCalledWith({ id: 'c', code: 'print(2)' }, '/a.xpyb');
    expect(editorView(stage).state.doc.toString()).toBe('print(2)');
    await shiftEnter(stage);
    expect(window.xpybApi.runCell).toHaveBeenCalledTimes(2);
  });

  it('does not run a cell twice while it is running', async () => {
    const stage = await open();
    window.xpybApi.runCell.mockImplementationOnce(() => new Promise(() => {}));
    await shiftEnter(stage);
    await shiftEnter(stage);
    expect(window.xpybApi.runCell).toHaveBeenCalledTimes(1);
  });

  it('shows tracebacks, tables and plots, and reports bridge errors', async () => {
    const stage = await open();
    window.xpybApi.runCell.mockResolvedValueOnce(
      ok([
        { type: 'traceback', text: 'ValueError: no' },
        { type: 'html', html: '<table><tr><td>cell</td></tr></table>' },
        { type: 'image', mime: 'image/png', data: btoa('png') },
      ]),
    );
    await shiftEnter(stage);
    const output = slot('right');
    expect(output.getByText('ValueError: no').className).toContain('output-error');
    expect(output.getByText('cell').tagName).toBe('TD');
    expect(output.getByRole('img', { name: 'Cell output' }).getAttribute('src')).toBe('blob:plot');
    window.xpybApi.runCell.mockRejectedValueOnce(new Error('bridge down'));
    await shiftEnter(stage);
    expect(screen.getByRole('alert').textContent).toBe('bridge down');
  });

  it('shows read-only highlighted code without Run buttons in thumbnails', async () => {
    await open();
    const thumbnails = screen.getByRole('navigation', { name: 'Slides' });
    expect(thumbnails.querySelector('pre span[class]').textContent).toContain('print');
    expect(thumbnails.querySelector('.cm-editor')).toBeNull();
    expect(screen.getAllByRole('button', { name: /^Run / })).toHaveLength(1);
  });
});

describe('ImageOutput', () => {
  const item = (text) => ({ kind: 'image', src: `data:image/png;base64,${btoa(text)}` });

  it('revokes Object URLs when the image changes and on unmount', () => {
    URL.createObjectURL = vi.fn().mockReturnValueOnce('blob:1').mockReturnValueOnce('blob:2');
    const view = render(<ImageOutput item={item('one')} />);
    expect(screen.getByRole('img').getAttribute('src')).toBe('blob:1');
    view.rerender(<ImageOutput item={item('two')} />);
    expect(URL.revokeObjectURL).toHaveBeenLastCalledWith('blob:1');
    view.unmount();
    expect(URL.revokeObjectURL).toHaveBeenLastCalledWith('blob:2');
  });

  it('renders nothing for an undecodable image', () => {
    render(<ImageOutput item={{ kind: 'image', src: 'data:image/png;base64,***' }} />);
    expect(screen.queryByRole('img')).toBeNull();
  });
});
