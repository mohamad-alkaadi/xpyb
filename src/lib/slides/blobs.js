const DATA_URL = /^data:([^;,]+)(;base64)?,(.*)$/s;

/**
 * Decodes base64 text into bytes.
 * @param {string} data Base64 text, possibly wrapped over several lines.
 * @returns {Uint8Array} Decoded bytes.
 */
const decodeBase64 = (data) =>
  Uint8Array.from(atob(data.replace(/\s/g, '')), (char) => char.charCodeAt(0));

/**
 * Converts a data URL to a Blob without any network request.
 * @param {string} url Base64 or percent-encoded data URL.
 * @returns {Blob|null} Blob, or null when the URL cannot be decoded.
 */
export const dataUrlToBlob = (url) => {
  const match = DATA_URL.exec(url);
  if (!match) return null;
  const [, type, base64, data] = match;
  try {
    const body = base64 ? decodeBase64(data) : decodeURIComponent(data);
    return new Blob([body], { type });
  } catch {
    return null;
  }
};
