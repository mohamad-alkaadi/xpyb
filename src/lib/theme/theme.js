/** App shell themes in toggle order. */
export const THEMES = Object.freeze([
  { id: 'dark', label: 'Dark' },
  { id: 'light', label: 'White' },
]);

/** Theme used until one is chosen. */
export const DEFAULT_THEME = 'light';

/** `localStorage` key holding the chosen theme. */
export const THEME_STORAGE_KEY = 'xpyb.theme';

/**
 * Reads the saved theme.
 * @returns {'dark'|'light'} Saved theme, or the default when missing, unknown or unreadable.
 */
export const readStoredTheme = () => {
  try {
    const saved = window.localStorage.getItem(THEME_STORAGE_KEY);
    return THEMES.some((theme) => theme.id === saved) ? saved : DEFAULT_THEME;
  } catch {
    return DEFAULT_THEME;
  }
};

/**
 * Saves the chosen theme. A blocked or full storage only loses the preference.
 * @param {'dark'|'light'} theme Theme id.
 * @returns {void}
 */
export const storeTheme = (theme) => {
  try {
    window.localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    // The theme still applies to this session.
  }
};
