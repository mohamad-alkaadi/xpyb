// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import App from '../../src/App.jsx';
import { LAYOUTS } from '../../src/lib/layouts/schemas.js';
import { makeDeck, makeSlide, textCell } from './fixtures.js';

const LONG = 'A very long slide title that needs a second line to be read in full by the audience';
const titled = LAYOUTS.filter((layout) => layout.slots.some((slot) => slot.id === 'title'));

const deck = () =>
  makeDeck(
    titled.map((layout) =>
      makeSlide(layout.id, layout.id, [
        textCell(`${layout.id}-title`, LONG, { slot: 'title' }),
      ]),
    ),
  );

beforeEach(() => {
  window.history.replaceState({}, '', '/?file=%2Fa.xpyb');
  window.xpybApi = { openDeck: vi.fn(async (filePath) => ({ filePath, deck: deck() })) };
});
afterEach(() => {
  cleanup();
  delete window.xpybApi;
  window.history.replaceState({}, '', '/');
});

describe('two-line titles', () => {
  it.each(titled.map((layout, index) => [layout.id, index + 1]))(
    '%s clamps its title to two lines without cutting the text',
    async (_, number) => {
      render(<App />);
      await screen.findByText(`${titled.length} slides`);
      fireEvent.click(screen.getByRole('button', { name: `Slide ${number}` }));
      const stage = within(screen.getByRole('region', { name: 'Slide editor' }));
      const text = stage.getByText(LONG).closest('.slide-text');
      expect(text.classList.contains('line-clamp-2')).toBe(true);
      expect(text.classList.contains('slide-title')).toBe(true);
      expect(text.textContent.trim()).toBe(LONG);
    },
  );

  it('leaves other slots unclamped', async () => {
    window.xpybApi.openDeck = vi.fn(async (filePath) => ({
      filePath,
      deck: makeDeck([
        makeSlide('a', 'titleAndBody', [textCell('b', 'Body copy', { slot: 'body' })]),
      ]),
    }));
    render(<App />);
    await screen.findByText('1 slide');
    const stage = within(screen.getByRole('region', { name: 'Slide editor' }));
    const text = stage.getByText('Body copy').closest('.slide-text');
    expect(text.classList.contains('line-clamp-2')).toBe(false);
  });
});
