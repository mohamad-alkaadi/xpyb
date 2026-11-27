import { isDarkColor } from './contrast.js';

const MAX_CODE_FONT_SIZE = 24;

/**
 * Picks the syntax highlighting that stays readable on a slide background.
 * @param {string} backgroundColor Slide background.
 * @param {{light: object, dark: object}} styles Highlight styles per background tone.
 * @returns {object} Highlight style.
 */
export const getCodeTheme = (backgroundColor, styles) =>
  isDarkColor(backgroundColor) ? styles.dark : styles.light;

/**
 * Caps the code size in slots that use large display text.
 * @param {{fontSize: number}} slot Slot definition.
 * @returns {number} Font size in logical pixels.
 */
export const getCodeFontSize = (slot) => Math.min(slot.fontSize, MAX_CODE_FONT_SIZE);
