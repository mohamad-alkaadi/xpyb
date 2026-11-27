// @vitest-environment jsdom
import { act, cleanup, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import DeckProvider, { useDeck } from '../../src/context/DeckContext.jsx';

const deck = { slides: [] };
const render = (initialPath) =>
  renderHook(useDeck, {
    wrapper: ({ children }) => <DeckProvider initialPath={initialPath}>{children}</DeckProvider>,
  });

beforeEach(() => {
  window.xpybApi = {
    openDeck: vi.fn(async (filePath) => ({ filePath, deck })),
    saveDeck: vi.fn(async (filePath) => ({ filePath })),
    convertNotebook: vi.fn(async () => ({ deckPath: '/n.xpyb', deck })),
  };
});
afterEach(() => {
  cleanup();
  delete window.xpybApi;
});

describe('DeckContext', () => {
  it('requires a provider', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => renderHook(useDeck)).toThrow('inside DeckProvider');
  });

  it('opens the initial deck and saves it', async () => {
    const { result } = render('/a.xpyb');
    await waitFor(() => expect(result.current.deck).toEqual(deck));
    await act(() => result.current.saveDeck());
    expect(window.xpybApi.saveDeck).toHaveBeenCalledWith('/a.xpyb', deck);
    expect(result.current.status).toBe('idle');
  });

  it('switches to a converted notebook', async () => {
    const { result } = render(null);
    expect(window.xpybApi.openDeck).not.toHaveBeenCalled();
    await act(() => result.current.convertNotebook('/n.ipynb'));
    expect(result.current.filePath).toBe('/n.xpyb');
  });

  it('keeps the current deck after a failure, then clears the error', async () => {
    const { result } = render('/a.xpyb');
    await waitFor(() => expect(result.current.deck).toEqual(deck));
    window.xpybApi.openDeck.mockRejectedValueOnce(new Error('broken'));
    await act(() => result.current.openDeck('/b.xpyb'));
    expect(result.current).toMatchObject({ status: 'error', error: 'broken', filePath: '/a.xpyb' });
    await act(() => result.current.openDeck('/c.xpyb'));
    expect(result.current).toMatchObject({ status: 'idle', error: null, filePath: '/c.xpyb' });
  });
});
