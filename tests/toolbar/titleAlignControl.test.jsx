// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import App from '../../src/App.jsx';
import { makeDeck, makeSlide, textCell } from '../layouts/fixtures.js';

const deck = () =>
  makeDeck([
    makeSlide('a', 'titleAndBody', [textCell('t', 'Heading')]),
    makeSlide('b', 'blank'),
  ]);

const open = async () => {
  render(<App />);
  await screen.findByText('2 slides');
};
const control = () => within(screen.getByRole('group', { name: 'Title alignment' }));
const button = (name) => control().getByRole('button', { name });
const titleAlignOf = (region) =>
  screen.getByRole('region', { name: region }).querySelector('[data-slot="title"] > div').style
    .textAlign;

beforeEach(() => {
  window.history.replaceState({}, '', '/?file=%2Fa.xpyb');
  window.xpybApi = {
    openDeck: vi.fn(async (filePath) => ({ filePath, deck: deck() })),
    saveDeck: vi.fn(async (filePath) => ({ filePath })),
    setFullScreen: vi.fn(async () => {}),
  };
});
afterEach(() => {
  cleanup();
  delete window.xpybApi;
  window.history.replaceState({}, '', '/');
});

describe('title alignment control', () => {
  it('starts on the alignment of the layout', async () => {
    await open();
    expect(button('Left').getAttribute('aria-pressed')).toBe('true');
    expect(titleAlignOf('Slide editor')).toBe('left');
  });

  it.each([
    ['Middle', 'center'],
    ['Right', 'right'],
    ['Left', 'left'],
  ])('%s updates the editor canvas immediately', async (label, textAlign) => {
    await open();
    fireEvent.click(button(label));
    expect(button(label).getAttribute('aria-pressed')).toBe('true');
    expect(titleAlignOf('Slide editor')).toBe(textAlign);
  });

  it('applies in Presentation Mode', async () => {
    await open();
    fireEvent.click(button('Right'));
    fireEvent.click(screen.getByRole('button', { name: 'Present' }));
    await screen.findByText('Heading');
    expect(titleAlignOf('Presentation slide')).toBe('right');
  });

  it('is disabled on a layout without a title', async () => {
    await open();
    fireEvent.click(screen.getByRole('button', { name: 'Slide 2' }));
    ['Left', 'Middle', 'Right'].forEach((name) => expect(button(name).disabled).toBe(true));
  });
});
