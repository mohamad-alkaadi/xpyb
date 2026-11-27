// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import App from '../../src/App.jsx';
import { codeCell, makeDeck, makeSlide } from '../layouts/fixtures.js';

const deck = () => makeDeck([makeSlide('a', 'titleAndBody', [codeCell('c', 'print(1)')])]);

beforeEach(() => {
  window.history.replaceState({}, '', '/?mode=present&file=%2Fa.xpyb');
  window.xpybApi = {
    openDeck: vi.fn(async (filePath) => ({ filePath, deck: deck() })),
    // Never settles, so the loader stays on screen.
    runCell: vi.fn(() => new Promise(() => {})),
    setFullScreen: vi.fn(async () => {}),
  };
});
afterEach(() => {
  cleanup();
  delete window.xpybApi;
  window.history.replaceState({}, '', '/');
});

describe('pre-compile loader', () => {
  it('shows progress on a white screen', async () => {
    render(<App />);
    await screen.findByText('Compiling cell 1 of 1...');
    expect(screen.getByRole('main', { name: 'Presentation' }).className).toContain('bg-white');
    expect(screen.getByRole('progressbar', { name: 'Compile progress' }).className).toContain('h-1.5');
  });
});
