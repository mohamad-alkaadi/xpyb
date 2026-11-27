// @vitest-environment jsdom
import { act, cleanup, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import DeckProvider, { useDeck } from '../../src/context/DeckContext.jsx';
import KernelProvider, { useKernel } from '../../src/context/KernelContext.jsx';
import { collectCodeCells } from '../../src/lib/kernel/results.js';

const cell = (id, type, source) => ({ id, type, source });
const deck = {
  slides: [
    { cells: [cell('a', 'code', '1'), cell('m', 'markdown', '# t')] },
    { cells: [cell('blank', 'code', '  '), cell('b', 'code', '2')] },
  ],
};
const render = async () => {
  const hook = renderHook(() => ({ ...useKernel(), openDeck: useDeck().openDeck }), {
    wrapper: ({ children }) => (
      <DeckProvider initialPath="/d/a.xpyb">
        <KernelProvider>{children}</KernelProvider>
      </DeckProvider>
    ),
  });
  await waitFor(() => expect(window.xpybApi.openDeck).toHaveBeenCalled());
  await act(async () => {});
  return hook.result;
};

beforeEach(() => {
  window.xpybApi = {
    openDeck: vi.fn(async (filePath) => ({ filePath, deck })),
    runCell: vi.fn(async () => ({ status: 'ok', outputs: [] })),
    runAllCells: vi.fn(async () => [{ cellId: 'a', status: 'error', outputs: [] }]),
    restartKernel: vi.fn(async () => ({ status: 'ok' })),
    detectInterpreters: vi.fn(async () => ({
      interpreters: [{ label: '.venv', path: '/d/.venv/bin/python' }],
      pythonPath: null,
    })),
    setPythonPath: vi.fn(async (pythonPath = null) => ({ pythonPath })),
  };
});
afterEach(() => {
  cleanup();
  delete window.xpybApi;
});

describe('KernelContext', () => {
  it('requires a provider', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => renderHook(useKernel)).toThrow('inside KernelProvider');
  });

  it('collects non-empty code cells', () => {
    expect(collectCodeCells(deck).map((item) => item.id)).toEqual(['a', 'b']);
    expect(collectCodeCells(null)).toEqual([]);
  });

  it('tracks a running cell and its result', async () => {
    const result = await render();
    let finish;
    window.xpybApi.runCell.mockImplementationOnce(() => new Promise((done) => (finish = done)));
    act(() => void result.current.runCell('a', '1'));
    expect(result.current.isRunning).toBe(true);
    expect(window.xpybApi.runCell).toHaveBeenCalledWith({ id: 'a', code: '1' }, '/d/a.xpyb');
    await act(async () => finish({ status: 'ok', outputs: [] }));
    expect(result.current.results.a.status).toBe('ok');
    expect(result.current.isRunning).toBe(false);
  });

  it('clears cells that Run All never reached', async () => {
    const result = await render();
    await act(() => result.current.runAllCells());
    expect(Object.keys(result.current.results)).toEqual(['a']);
    expect(window.xpybApi.runAllCells.mock.calls[0][0]).toHaveLength(2);
  });

  it('ignores results that arrive after a restart', async () => {
    const result = await render();
    let finish;
    window.xpybApi.runCell.mockImplementationOnce(() => new Promise((done) => (finish = done)));
    act(() => void result.current.runCell('a', '1'));
    await act(() => result.current.restartKernel());
    await act(async () => finish({ status: 'aborted', outputs: [] }));
    expect(result.current.results).toEqual({});
  });

  it('reports bridge and restart errors', async () => {
    const result = await render();
    window.xpybApi.runCell.mockRejectedValueOnce(new Error('bridge down'));
    await act(() => result.current.runCell('a', '1'));
    expect(result.current).toMatchObject({ error: 'bridge down', results: {} });
    window.xpybApi.restartKernel.mockResolvedValueOnce({
      status: 'error',
      outputs: [{ text: 'no kernel' }],
    });
    await act(() => result.current.restartKernel());
    expect(result.current.error).toBe('no kernel');
  });

  it('detects and selects interpreters, clearing old results', async () => {
    const result = await render();
    await act(() => result.current.detectInterpreters());
    expect(result.current.interpreters).toHaveLength(1);
    await act(() => result.current.runCell('a', '1'));
    await act(() => result.current.setPythonPath('/d/.venv/bin/python'));
    expect(result.current).toMatchObject({ pythonPath: '/d/.venv/bin/python', results: {} });
    window.xpybApi.setPythonPath.mockRejectedValueOnce(new Error('bad path'));
    await act(() => result.current.setPythonPath('/x'));
    expect(result.current.error).toBe('bad path');
  });

  it('clears results when another deck opens', async () => {
    const result = await render();
    await act(() => result.current.runCell('a', '1'));
    await act(() => result.current.openDeck('/d/b.xpyb'));
    expect(result.current.results).toEqual({});
  });
});
