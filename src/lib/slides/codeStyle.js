import { DEFAULT_COLORS } from '../deck/slideActions.js';
import { blendColors, isDarkColor, normalizeHex } from './contrast.js';

/** Largest tint opacity of the frosted backdrop, in percent. */
export const MAX_BACKDROP = 80;

/** Tint colors of the frosted backdrop. */
export const TINTS = Object.freeze({ dark: '#000000', light: '#ffffff' });

// Pure black or white keeps at least a 4.5:1 contrast on every solid color.
const AUTO_TEXT = Object.freeze({ dark: '#ffffff', light: '#000000' });

/**
 * Limits a backdrop opacity to the supported range.
 * @param {unknown} value Candidate percentage.
 * @returns {number} Percentage from 0 to 80.
 */
export const clampBackdrop = (value) => Math.min(Math.max(Number(value) || 0, 0), MAX_BACKDROP);

/**
 * Reads the code block settings of a slide, filling in defaults.
 * @param {object} [slide] Deck slide.
 * @returns {{opacity: number, tint: 'dark'|'light', autoContrast: boolean}} Settings.
 */
export const getCodeSettings = (slide) => ({
  opacity: clampBackdrop(slide?.codeBackdrop),
  tint: slide?.codeTint === 'light' ? 'light' : 'dark',
  autoContrast: slide?.autoContrast !== false,
});

/**
 * Formats a hex color with an opacity.
 * @param {string} color `#rrggbb` color.
 * @param {number} alpha Opacity from 0 to 1.
 * @returns {string} CSS rgba color.
 */
const toRgba = (color, alpha) => {
  const channels = [1, 3, 5].map((at) => parseInt(color.slice(at, at + 2), 16));
  return `rgba(${channels.join(', ')}, ${alpha})`;
};

/**
 * Works out how code and output blocks look on a slide.
 * @param {object} [slide] Deck slide.
 * @returns {{isDark: boolean, backdrop: (string|null), textColor: (string|undefined)}}
 *   Tone behind the text, backdrop tint, and text color (undefined inherits the slide color).
 */
export const getCodeAppearance = (slide) => {
  const { opacity, tint, autoContrast } = getCodeSettings(slide);
  const background = normalizeHex(slide?.backgroundColor, DEFAULT_COLORS.backgroundColor);
  const isDark = isDarkColor(blendColors(background, TINTS[tint], opacity / 100));
  return {
    isDark,
    backdrop: opacity > 0 ? toRgba(TINTS[tint], opacity / 100) : null,
    textColor: autoContrast ? AUTO_TEXT[isDark ? 'dark' : 'light'] : undefined,
  };
};
