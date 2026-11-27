import { createRequire } from 'node:module';
import { describe, expect, it } from 'vitest';
import { makeDeck, makeSlide } from '../layouts/fixtures.js';

const require = createRequire(import.meta.url);
const { deckToNotebook } = require('../../electron/lib/converter/deckToNotebook.js');
const { notebookToDeck } = require('../../electron/lib/converter/notebookToDeck.js');

describe('code style persistence', () => {
  it('survives a round trip through a notebook', () => {
    const style = { codeBackdrop: 40, codeTint: 'light', autoContrast: false };
    const deck = makeDeck([{ ...makeSlide('a', 'blank'), ...style }, makeSlide('b', 'blank')]);
    const [styled, plain] = notebookToDeck(deckToNotebook(deck)).slides;
    expect(styled).toMatchObject(style);
    expect(plain).not.toHaveProperty('codeBackdrop');
  });
});
