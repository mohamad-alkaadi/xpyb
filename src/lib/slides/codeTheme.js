import { defaultHighlightStyle } from '@codemirror/language';
import { oneDarkHighlightStyle } from '@codemirror/theme-one-dark';
import { EditorView } from '@codemirror/view';
import { isDarkColor } from './contrast.js';

const MAX_CODE_FONT_SIZE = 24;
const TRANSPARENT = 'transparent';

/** Editor chrome without any background of its own, so the slide shows through. */
export const TRANSPARENT_THEME_SPEC = Object.freeze({
  '&': { backgroundColor: TRANSPARENT, color: 'inherit' },
  '.cm-gutters': { backgroundColor: TRANSPARENT, color: 'inherit', border: 'none', opacity: '0.5' },
  '.cm-content': { caretColor: 'currentColor' },
  '.cm-cursor': { borderLeftColor: 'currentColor' },
  '.cm-scroller': { overflow: 'auto' },
});

const THEMES = Object.freeze({
  light: EditorView.theme(TRANSPARENT_THEME_SPEC, { dark: false }),
  dark: EditorView.theme(TRANSPARENT_THEME_SPEC, { dark: true }),
});

/** Syntax highlighting per background tone. */
export const HIGHLIGHT_STYLES = Object.freeze({
  light: defaultHighlightStyle,
  dark: oneDarkHighlightStyle,
});

/**
 * Picks the transparent editor theme for a background tone.
 * @param {boolean} isDark True when the code sits on a dark color.
 * @returns {import('@codemirror/state').Extension} Editor theme.
 */
export const getTransparentTheme = (isDark) => (isDark ? THEMES.dark : THEMES.light);

/**
 * Picks the syntax highlighting that stays readable on a slide background.
 * @param {string} backgroundColor Color behind the code.
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
