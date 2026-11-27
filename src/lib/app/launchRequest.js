/**
 * Reads the launch request passed by the main process in the page URL.
 * @param {string} search URL query string.
 * @returns {{mode: 'editor'|'present', filePath: (string|null)}} Launch request.
 */
export const parseLaunchRequest = (search) => {
  const params = new URLSearchParams(search);
  return {
    mode: params.get('mode') === 'present' ? 'present' : 'editor',
    filePath: params.get('file') || null,
  };
};
