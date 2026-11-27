// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import App from '../../src/App.jsx';
import SlideStage from '../../src/components/slides/SlideStage.jsx';
import { codeCell, makeDeck, makeSlide, textCell } from './fixtures.js';

const deck = () =>
  makeDeck([
    makeSlide('a', 'titleAndBody', [textCell('t', 'First'), codeCell('c', 'print(42)')]),
    makeSlide('b', 'blank'),
  ]);

const open = async () => {
  render(<App />);
  await screen.findByText('2 slides');
  return within(screen.getByRole('region', { name: 'Slide editor' }));
};
const click = (name) => fireEvent.click(screen.getByRole('button', { name }));
const slotMode = (stage, slot, mode) =>
  within(stage.getByRole('group', { name: `${slot} content type` })).getByRole('button', {
    name: mode,
  });

beforeEach(() => {
  window.history.replaceState({}, '', '/?file=%2Fa.xpyb');
  window.xpybApi = { openDeck: vi.fn(async (filePath) => ({ filePath, deck: deck() })) };
});
afterEach(() => {
  cleanup();
  delete window.xpybApi;
  window.history.replaceState({}, '', '/');
  vi.unstubAllGlobals();
});

describe('SlideStage', () => {
  it('scales a fixed 1280x720 canvas to its container and disconnects on unmount', () => {
    let resize;
    const disconnect = vi.fn();
    vi.stubGlobal(
      'ResizeObserver',
      class {
        constructor(callback) {
          resize = callback;
        }
        observe() {}
        disconnect = disconnect;
      },
    );
    const view = render(<SlideStage label="Stage">x</SlideStage>);
    act(() => resize([{ contentRect: { width: 640, height: 720 } }]));
    const { style } = screen.getByRole('region', { name: 'Stage' });
    expect(style).toMatchObject({
      width: '1280px',
      height: '720px',
      transform: 'scale(0.5)',
      top: '180px',
      left: '0px',
    });
    view.unmount();
    expect(disconnect).toHaveBeenCalled();
  });
});

describe('editor shell', () => {
  it('adds, duplicates, reorders, selects and deletes slides', async () => {
    await open();
    const thumbnails = () => screen.getAllByRole('button', { name: /^Slide \d+$/ });
    click('Add slide');
    expect(thumbnails()).toHaveLength(3);
    click('Slide 1');
    click('Duplicate slide');
    expect(screen.getByText('4 slides')).toBeTruthy();
    expect(thumbnails()[1].getAttribute('aria-current')).toBe('true');
    click('Move down slide');
    expect(thumbnails()[2].getAttribute('aria-current')).toBe('true');
    click('Move up slide');
    click('Delete slide');
    expect(thumbnails()).toHaveLength(3);
  });

  it('offers a way back after the last slide is deleted', async () => {
    await open();
    click('Delete slide');
    click('Delete slide');
    expect(screen.getByText(/This deck has no slides/)).toBeTruthy();
    click('Add slide');
    expect(screen.getByText('1 slide')).toBeTruthy();
  });

  it('changes layout through the picker without losing content', async () => {
    const stage = await open();
    click('Layout');
    const dialog = within(screen.getByRole('dialog'));
    expect(dialog.getAllByRole('button', { name: /./ })).toHaveLength(12);
    fireEvent.click(dialog.getByRole('button', { name: 'Blank' }));
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(screen.getByText(/not shown in this layout: 2/)).toBeTruthy();
    click('Layout');
    fireEvent.click(screen.getByRole('button', { name: 'Title and body' }));
    expect(stage.getByText('First')).toBeTruthy();
    expect(screen.queryByText(/not shown/)).toBeNull();
  });

  it('closes the picker with Escape', async () => {
    await open();
    click('Layout');
    fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' });
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('applies colors to the active slide only', async () => {
    await open();
    fireEvent.change(screen.getByLabelText('Background'), { target: { value: '#000000' } });
    fireEvent.change(screen.getByLabelText('Text color'), { target: { value: '#ff0000' } });
    const [editor] = within(screen.getByRole('main')).getAllByTestId('slide-canvas');
    expect(editor.style.backgroundColor).toBe('rgb(0, 0, 0)');
    expect(editor.style.color).toBe('rgb(255, 0, 0)');
    click('Slide 2');
    expect(screen.getByLabelText('Background').value).toBe('#ffffff');
  });

  it('edits text in a slot', async () => {
    const stage = await open();
    fireEvent.click(stage.getByRole('button', { name: 'Edit Title' }));
    const input = stage.getByRole('textbox', { name: 'Title text' });
    fireEvent.change(input, { target: { value: '**Updated**' } });
    fireEvent.blur(input);
    expect(stage.getByText('Updated').tagName).toBe('STRONG');
  });

  it('switches a slot between code, text and bound output', async () => {
    const stage = await open();
    expect(stage.getByRole('textbox').textContent).toBe('print(42)');
    fireEvent.click(slotMode(stage, 'Body', 'Output'));
    expect(stage.getByText('42')).toBeTruthy();
    fireEvent.click(slotMode(stage, 'Body', 'Text'));
    expect(stage.getByText('print(42)')).toBeTruthy();
    fireEvent.click(slotMode(stage, 'Title', 'Output'));
    fireEvent.click(slotMode(stage, 'Body', 'Code'));
    fireEvent.change(stage.getByRole('combobox', { name: 'Title output source' }), {
      target: { value: 'c' },
    });
    const title = screen.getByRole('main').querySelector('[data-slot="title"]');
    expect(title.querySelector('pre').textContent).toBe('42\n');
  });
});
