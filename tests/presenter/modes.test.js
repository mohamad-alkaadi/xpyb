import { describe, expect, it } from 'vitest';
import { getPresenterAction } from '../../src/lib/presentation/keys.js';
import {
  DEFAULT_MODE,
  DISPLAY_MODES,
  getCellView,
  getOutputBadge,
  nextMode,
  otherView,
  toggleViews,
} from '../../src/lib/presentation/modes.js';
import { findEditableCellId, listShownCodeIds } from '../../src/lib/presentation/slides.js';
import { codeCell, makeSlide, textCell } from '../layouts/fixtures.js';

describe('display modes', () => {
  it('offers three modes, starting on the hover button', () => {
    expect(DISPLAY_MODES.map((mode) => mode.id)).toEqual(['hover-toggle', 'tabs', 'pip']);
    expect(DEFAULT_MODE).toBe('hover-toggle');
  });

  it('cycles through the modes and wraps around', () => {
    expect(nextMode('hover-toggle')).toBe('tabs');
    expect(nextMode('tabs')).toBe('pip');
    expect(nextMode('pip')).toBe('hover-toggle');
  });

  it.each([
    ['m', 'cycleMode'],
    ['M', 'cycleMode'],
    ['o', 'toggleView'],
    ['O', 'toggleView'],
  ])('maps %s to %s, except while typing', (key, action) => {
    expect(getPresenterAction({ key })).toBe(action);
    expect(getPresenterAction({ key, ctrlKey: true })).toBeNull();
    expect(getPresenterAction({ key, target: { closest: () => ({}) } })).toBeNull();
  });
});

describe('cell views', () => {
  it('starts on code and names the other view', () => {
    expect(getCellView({}, 'a')).toBe('code');
    expect(getCellView({ a: 'output' }, 'a')).toBe('output');
    expect([otherView('code'), otherView('output')]).toEqual(['output', 'code']);
  });

  it('toggles cells together, aligning mixed views on output first', () => {
    const mixed = toggleViews({ a: 'output' }, ['a', 'b']);
    expect(mixed).toEqual({ a: 'output', b: 'output' });
    expect(toggleViews(mixed, ['a', 'b'])).toEqual({ a: 'code', b: 'code' });
    expect(toggleViews({}, [])).toEqual({});
  });

  it('badges ready output and errors only', () => {
    const badge = (kinds, isRunning = false) =>
      getOutputBadge({ items: kinds.map((kind) => ({ kind })), isRunning });
    expect(badge([])).toBeNull();
    expect(badge(['text'], true)).toBeNull();
    expect(badge(['image'])).toBe('ready');
    expect(badge(['text', 'error'])).toBe('error');
  });

  it('lists the code cells a slide shows, in layout order', () => {
    const slide = makeSlide('s', 'twoColumns', [
      codeCell('right', 'b', { slot: 'right' }),
      codeCell('left', 'a', { slot: 'left' }),
      textCell('title', 'T'),
    ]);
    expect(listShownCodeIds(slide)).toEqual(['left', 'right']);
    expect(findEditableCellId(slide)).toBe('left');
    expect(listShownCodeIds(undefined)).toEqual([]);
  });
});
