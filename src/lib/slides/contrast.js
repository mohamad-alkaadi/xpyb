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
 * Tells whether light text reads better than dark text on a background.
 * @param {string} color Hex background color.
 * @returns {boolean} True for dark backgrounds.
 */
export const isDarkColor = (color) => {
  const hex = normalizeHex(color, '#ffffff');
  const [red, green, blue] = [1, 3, 5].map((at) => toLinear(parseInt(hex.slice(at, at + 2), 16)));
  const luminance = 0.2126 * red + 0.7152 * green + 0.0722 * blue;
  // Contrast against white beats contrast against black below this luminance.
  return luminance < 0.179;
};
