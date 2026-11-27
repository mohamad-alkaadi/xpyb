// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import App from '../../src/App.jsx';

const visit = (search) => window.history.replaceState({}, '', `/${search}`);
const bridge = (openDeck) => {
  window.xpybApi = { openDeck: vi.fn(openDeck) };
};

afterEach(() => {
  cleanup();
  delete window.xpybApi;
  visit('');
});

describe('App', () => {
  it('shows an empty editor', () => {
    render(<App />);
    expect(screen.getByRole('heading', { name: 'xpyb' })).toBeTruthy();
    expect(screen.getByText('No deck open.')).toBeTruthy();
  });

  it('opens the requested deck in the editor', async () => {
    bridge(async (filePath) => ({ filePath, deck: { slides: [{}] } }));
    visit('?mode=editor&file=%2Fa.xpyb');
    render(<App />);
    expect(await screen.findByText('1 slide')).toBeTruthy();
    expect(screen.getByText('/a.xpyb')).toBeTruthy();
  });

  it('switches to the presenter view', async () => {
    bridge(async (filePath) => ({ filePath, deck: { slides: [{}, {}] } }));
    visit('?mode=present&file=%2Fa.xpyb');
    render(<App />);
    expect(await screen.findByText('2 slides')).toBeTruthy();
    expect(screen.getByRole('main', { name: 'Presentation' })).toBeTruthy();
    expect(screen.queryByRole('heading')).toBeNull();
  });

  it('shows loading and error states', async () => {
    bridge(async () => {
      throw new Error('Cannot read deck');
    });
    visit('?file=%2Fa.xpyb');
    render(<App />);
    expect((await screen.findByRole('alert')).textContent).toBe('Cannot read deck');
  });
});
