// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import App from '../../src/App.jsx';
import { readStoredTheme, storeTheme, THEME_STORAGE_KEY } from '../../src/lib/theme/theme.js';
import { makeDeck, makeSlide } from '../layouts/fixtures.js';

const deck = () =>
  makeDeck([{ ...makeSlide('a', 'titleOnly'), backgroundColor: '#123456', textColor: '#fedcba' }]);

const open = async () => {
  render(<App />);
  await screen.findByText('1 slide');
};
const choose = (name) =>
  fireEvent.click(
    within(screen.getByRole('group', { name: 'App theme' })).getByRole('button', { name }),
  );
const shellTheme = () => document.querySelector('[data-theme]').getAttribute('data-theme');
const canvasColors = () =>
  screen.getAllByTestId('slide-canvas').map((canvas) => canvas.getAttribute('style'));

beforeEach(() => {
  window.localStorage.clear();
  window.history.replaceState({}, '', '/?file=%2Fa.xpyb');
  window.xpybApi = { openDeck: vi.fn(async (filePath) => ({ filePath, deck: deck() })) };
});
afterEach(() => {
  cleanup();
  delete window.xpybApi;
  window.history.replaceState({}, '', '/');
});

describe('app theme', () => {
  it('starts White and switches between Dark and White', async () => {
    await open();
    expect(shellTheme()).toBe('light');
    choose('Dark');
    expect(shellTheme()).toBe('dark');
    expect(window.localStorage.getItem(THEME_STORAGE_KEY)).toBe('dark');
    choose('White');
    expect(shellTheme()).toBe('light');
  });

  it('restores the saved theme', async () => {
    window.localStorage.setItem(THEME_STORAGE_KEY, 'dark');
    await open();
    expect(shellTheme()).toBe('dark');
  });

  it('never changes slide canvas colors', async () => {
    await open();
    const before = canvasColors();
    choose('Dark');
    expect(canvasColors()).toEqual(before);
    expect(before[0]).toContain('rgb(18, 52, 86)');
  });

  it('covers the layout picker modal', async () => {
    await open();
    choose('Dark');
    fireEvent.click(screen.getByRole('button', { name: 'Layout' }));
    const dialog = screen.getByRole('dialog');
    expect(dialog.closest('[data-theme]').getAttribute('data-theme')).toBe('dark');
  });

  it('keeps the toggle and a white intro screen when no deck is open', () => {
    window.localStorage.setItem(THEME_STORAGE_KEY, 'dark');
    window.history.replaceState({}, '', '/');
    render(<App />);
    expect(screen.getByRole('group', { name: 'App theme' })).toBeTruthy();
    const intro = screen.getByText('No deck open.').closest('main');
    expect(intro.className).toContain('bg-white');
    expect(intro.className).toContain('text-[#0f172a]');
  });
});

describe('theme storage', () => {
  it('ignores unknown values', () => {
    window.localStorage.setItem(THEME_STORAGE_KEY, 'purple');
    expect(readStoredTheme()).toBe('light');
  });

  it('survives unavailable storage', () => {
    vi.spyOn(window, 'localStorage', 'get').mockImplementation(() => {
      throw new Error('blocked');
    });
    expect(readStoredTheme()).toBe('light');
    expect(() => storeTheme('dark')).not.toThrow();
  });
});
