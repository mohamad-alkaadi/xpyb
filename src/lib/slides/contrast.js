const HEX_COLOR = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i;

/**
 * Normalizes a hex color to the `#rrggbb` form color inputs require.
 * @param {unknown} color Candidate color.
 * @param {string} fallback Used when the color is not a hex color.
 * @returns {string} Lowercase `#rrggbb` color.
 */
export const normalizeHex = (color, fallback) => {
  if (typeof color !== 'string' || !HEX_COLOR.test(color)) return fallback;
  const digits = color.slice(1).toLowerCase();
  return `#${digits.length === 3 ? [...digits].map((digit) => digit + digit).join('') : digits}`;
};

/**
 * Converts one sRGB channel to linear light.
 * @param {number} value Channel from 0 to 255.
 * @returns {number} Linear value.
 */
const toLinear = (value) => {
  const channel = value / 255;
  return channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
};

/**
 * Splits a hex color into its sRGB channels.
 * @param {string} color Hex color; anything else counts as white.
 * @returns {number[]} Red, green and blue from 0 to 255.
 */
const toChannels = (color) => {
  const hex = normalizeHex(color, '#ffffff');
  return [1, 3, 5].map((at) => parseInt(hex.slice(at, at + 2), 16));
};

/**
 * Computes the WCAG relative luminance of a color.
 * @param {string} color Hex color.
 * @returns {number} Luminance from 0 to 1.
 */
export const getLuminance = (color) => {
  const [red, green, blue] = toChannels(color).map(toLinear);
  return 0.2126 * red + 0.7152 * green + 0.0722 * blue;
};

/**
 * Computes the WCAG contrast ratio between two colors.
 * @param {string} first Hex color.
 * @param {string} second Hex color.
 * @returns {number} Ratio from 1 to 21.
 */
export const getContrastRatio = (first, second) => {
  const [low, high] = [getLuminance(first), getLuminance(second)].sort((a, b) => a - b);
  return (high + 0.05) / (low + 0.05);
};

/**
 * Computes the color seen when a translucent tint covers a solid color.
 * @param {string} base Hex color underneath.
 * @param {string} tint Hex tint color.
 * @param {number} alpha Tint opacity from 0 to 1.
 * @returns {string} Resulting `#rrggbb` color.
 */
export const blendColors = (base, tint, alpha) => {
  const under = toChannels(base);
  const mixed = toChannels(tint).map((value, i) => Math.round(value * alpha + under[i] * (1 - alpha)));
  return `#${mixed.map((value) => value.toString(16).padStart(2, '0')).join('')}`;
};

/**
 * Tells whether light text reads better than dark text on a background.
 * @param {string} color Hex background color.
 * @returns {boolean} True when contrast against white beats contrast against black.
 */
export const isDarkColor = (color) => getLuminance(color) < 0.179;
